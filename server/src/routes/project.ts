import express, { type Request, type Response } from "express";
import multer from "multer";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { uploadImage } from "../services/cosService.js";
import { pixelateImage } from "../utils/pixelator.js";
import { mapColors, type BeadColorInput } from "../utils/colorMapper.js";

const router: express.Router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"];
const ERROR_CODE_FILE_TOO_LARGE = 2001;
const ERROR_CODE_INVALID_FORMAT = 2002;

interface GenerateBody {
  name?: string;
  width?: string;
  height?: string;
  brand?: string;
}

// POST /api/project/generate
router.post(
  "/generate",
  authMiddleware,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const userId = req.body.userId as string;
      const file = req.file;
      const { name, width: widthStr, height: heightStr, brand: brandRaw } = req.body as GenerateBody;

      if (!file) {
        res.status(400).json({ code: ERROR_CODE_INVALID_FORMAT, message: "请上传图片文件", data: null });
        return;
      }

      if (!ALLOWED_MIMES.includes(file.mimetype)) {
        res.status(400).json({ code: ERROR_CODE_INVALID_FORMAT, message: "仅支持 JPG/PNG/WEBP 格式", data: null });
        return;
      }

      const width = parseInt(widthStr ?? "29", 10);
      const height = parseInt(heightStr ?? "29", 10);
      const brand = brandRaw || "mard";

      if (width < 10 || width > 200 || height < 10 || height > 200) {
        res.status(400).json({ code: 400, message: "宽高范围 10-200", data: null });
        return;
      }

      // 上传原图到 COS
      const ext = file.mimetype === "image/jpeg" ? ".jpg" : file.mimetype === "image/png" ? ".png" : ".webp";
      const cosPath = `projects/${userId}/${Date.now()}${ext}`;
      const imageUrl = await uploadImage(file.buffer, cosPath);

      // 像素化
      const pixelArray = await pixelateImage(file.buffer, width, height);

      // 获取品牌色卡（兼容自定义色板 custom_xxx）
      const colors = await prisma.beadColor.findMany({
        where: { brand },
        orderBy: { code: "asc" },
      });

      if (colors.length === 0) {
        res.status(400).json({ code: 400, message: `品牌 ${brand} 无色卡数据`, data: null });
        return;
      }

      const colorInputs: BeadColorInput[] = colors.map((c) => ({ id: c.id, rgb: c.rgb }));
      const gridData = mapColors(pixelArray, colorInputs);

      // 存库
      const project = await prisma.project.create({
        data: {
          userId,
          name: name || "未命名图纸",
          width,
          height,
          brand,
          gridData,
        },
      });

      res.json({
        code: 200,
        message: "ok",
        data: { projectId: project.id, gridData, imageUrl },
      });
    } catch (err: unknown) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({ code: ERROR_CODE_FILE_TOO_LARGE, message: "图片大小不能超过 10MB", data: null });
          return;
        }
      }
      const message = err instanceof Error ? err.message : "生成图纸失败";
      console.error("[project/generate]", message);
      res.status(500).json({ code: 500, message, data: null });
    }
  }
);

// GET /api/project/list?page=1
router.get("/list", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId as string;
    const page = Math.max(1, parseInt((req.query.page as string) ?? "1", 10));
    const pageSize = 20;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, name: true, width: true, height: true, brand: true, updatedAt: true },
      }),
      prisma.project.count({ where: { userId } }),
    ]);

    res.json({
      code: 200,
      message: "ok",
      data: { list: projects, total, page, pageSize },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "获取图纸列表失败";
    console.error("[project/list]", message);
    res.status(500).json({ code: 500, message, data: null });
  }
});

// GET /api/project/:id
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId as string;
    const id = req.params.id as string;

    const project = await prisma.project.findFirst({
      where: { id, userId },
    });

    if (!project) {
      res.status(404).json({ code: 404, message: "图纸不存在", data: null });
      return;
    }

    res.json({ code: 200, message: "ok", data: project });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "获取图纸失败";
    console.error("[project/detail]", message);
    res.status(500).json({ code: 500, message, data: null });
  }
});

function isValidGridData(data: unknown): data is string[][] {
  if (!Array.isArray(data)) return false;
  return data.every(
    (row) => Array.isArray(row) && row.every((cell) => typeof cell === "string")
  );
}

// PUT /api/project/:id
router.put("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId as string;
    const id = req.params.id as string;
    const { gridData, name } = req.body as { gridData?: unknown; name?: string };

    const existing = await prisma.project.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      res.status(403).json({ code: 3001, message: "无权修改此图纸", data: null });
      return;
    }

    const data: Prisma.ProjectUpdateInput = {};
    if (gridData !== undefined) {
      if (!isValidGridData(gridData)) {
        res.status(400).json({ code: 400, message: "gridData 格式无效", data: null });
        return;
      }
      data.gridData = gridData as Prisma.InputJsonValue;
    }
    if (name !== undefined) data.name = name;

    const project = await prisma.project.update({
      where: { id },
      data,
    });

    res.json({ code: 200, message: "ok", data: { id: project.id } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "保存图纸失败";
    console.error("[project/update]", message);
    res.status(500).json({ code: 500, message, data: null });
  }
});

export default router;
