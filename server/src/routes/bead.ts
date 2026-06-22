import express, { type Request, type Response } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, type AuthenticatedRequest } from "../middleware/auth.js";

const router: express.Router = express.Router();

// GET /api/bead/colors?brand=mard
router.get("/colors", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { brand } = req.query;
    const userId = (req as AuthenticatedRequest).userId;

    if (brand && typeof brand === "string") {
      const colors = await prisma.beadColor.findMany({
        where: { brand },
        orderBy: { code: "asc" },
      });

      res.json({ code: 200, message: "ok", data: colors });
      return;
    }

    // 无 brand 参数：返回系统内置 + 用户自定义色板
    const [systemColors, customColors] = await Promise.all([
      prisma.beadColor.findMany({
        where: { brand: { in: ["mard", "coco"] } },
        orderBy: [{ brand: "asc" }, { code: "asc" }],
      }),
      prisma.beadColor.findMany({
        where: { brand: { startsWith: `custom_${userId}_` } },
        orderBy: [{ brand: "asc" }, { code: "asc" }],
      }),
    ]);

    const allColors = [...systemColors, ...customColors];

    // 按品牌分组
    const grouped: Record<string, typeof allColors> = {};
    for (const color of allColors) {
      if (!grouped[color.brand]) {
        grouped[color.brand] = [];
      }
      grouped[color.brand].push(color);
    }

    res.json({ code: 200, message: "ok", data: grouped });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "获取色卡失败";
    console.error("[bead/colors]", message);
    res.status(500).json({ code: 500, message, data: null });
  }
});

export default router;
