import express, { type Request, type Response } from "express";
import { authMiddleware, type AuthenticatedRequest } from "../middleware/auth.js";
import { uploadImage } from "../services/cosService.js";
import { pixelateImage } from "../utils/pixelator.js";
import { mapColors, type BeadColorInput } from "../utils/colorMapper.js";
import { prisma } from "../lib/prisma.js";

const router: express.Router = express.Router();

const ERROR_CODE_NOT_UNLOCKED = 5001;
const ERROR_CODE_API_FAILED = 5002;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MATTING_TIMEOUT_MS = 10_000;

interface MattingBody {
  imageBase64?: string;
  width?: string;
  height?: string;
  brand?: string;
}

router.post(
  "/matting",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).userId as string;
      const { imageBase64, width: widthStr, height: heightStr, brand: brandRaw } = req.body as MattingBody;

      if (!imageBase64) {
        res.status(400).json({ code: 400, message: "请上传图片", data: null });
        return;
      }

      // Strip data URL prefix if present
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const imageBuffer = Buffer.from(base64Data, "base64");

      if (imageBuffer.length > MAX_IMAGE_BYTES) {
        res.status(400).json({ code: 400, message: "图片大小不能超过 5MB", data: null });
        return;
      }

      // Call Remove.bg API
      const apiKey = process.env.REMOVEBG_API_KEY;
      if (!apiKey) {
        console.error("[tool/matting] REMOVEBG_API_KEY not configured");
        res.status(500).json({ code: ERROR_CODE_API_FAILED, message: "抠图服务未配置", data: null });
        return;
      }

      let resultBuffer: Buffer;
      try {
        resultBuffer = await callRemoveBg(apiKey, imageBuffer);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "抠图失败";
        console.error("[tool/matting] Remove.bg error:", msg);
        res.status(502).json({ code: ERROR_CODE_API_FAILED, message: "抠图失败，请稍后重试", data: null });
        return;
      }

      // Upload result to COS
      const cosPath = `matting/${userId}/${Date.now()}.png`;
      const imageUrl = await uploadImage(resultBuffer, cosPath);

      // If width/height/brand provided, also do pixelation + color mapping
      const width = parseInt(widthStr ?? "29", 10);
      const height = parseInt(heightStr ?? "29", 10);
      const brand = brandRaw || "mard";

      let gridData: string[][] | undefined;
      if (width >= 10 && width <= 200 && height >= 10 && height <= 200) {
        const pixelArray = await pixelateImage(resultBuffer, width, height);

        const colors = await prisma.beadColor.findMany({
          where: { brand },
          orderBy: { code: "asc" },
        });

        if (colors.length > 0) {
          const colorInputs: BeadColorInput[] = colors.map((c) => ({ id: c.id, rgb: c.rgb }));
          gridData = mapColors(pixelArray, colorInputs);
        }
      }

      res.json({
        code: 200,
        message: "ok",
        data: { imageUrl, gridData },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "抠图处理失败";
      console.error("[tool/matting]", message);
      res.status(500).json({ code: 500, message, data: null });
    }
  }
);

async function callRemoveBg(apiKey: string, imageBuffer: Buffer): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MATTING_TIMEOUT_MS);

  try {
    const formData = new FormData();
    formData.append("image_file", new Blob([new Uint8Array(imageBuffer)]), "image.png");
    formData.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Remove.bg API error: ${response.status} ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } finally {
    clearTimeout(timeout);
  }
}

export default router;
