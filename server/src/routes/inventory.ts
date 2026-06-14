import express, { type Request, type Response } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

const router: express.Router = express.Router();

const MAX_ITEMS_PER_SYNC = 200;
const MAX_QUANTITY_PER_COLOR = 9999;

interface SyncItem {
  colorId: string;
  quantity: number;
}

// GET /api/inventory
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId as string;

    const inventories = await prisma.inventory.findMany({
      where: { userId },
    });

    res.json({ code: 200, message: "ok", data: inventories });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "获取库存失败";
    console.error("[inventory/list]", message);
    res.status(500).json({ code: 500, message, data: null });
  }
});

// POST /api/inventory/sync
router.post("/sync", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId as string;
    const { items } = req.body as { items?: SyncItem[] };

    if (!Array.isArray(items)) {
      res.status(400).json({ code: 400, message: "参数格式错误", data: null });
      return;
    }

    // 过滤掉 quantity <= 0 的项
    const validItems = items.filter(
      (item) => item.colorId && typeof item.colorId === "string" && item.quantity > 0
    );

    // 限制单次同步最多 200 种颜色
    if (validItems.length > MAX_ITEMS_PER_SYNC) {
      res.status(400).json({
        code: 4001,
        message: `单次同步最多 ${MAX_ITEMS_PER_SYNC} 种颜色`,
        data: null,
      });
      return;
    }

    // 单色库存上限 9999
    for (const item of validItems) {
      if (item.quantity > MAX_QUANTITY_PER_COLOR) {
        res.status(400).json({
          code: 4001,
          message: `单色库存上限 ${MAX_QUANTITY_PER_COLOR}`,
          data: null,
        });
        return;
      }
    }

    // 覆盖式更新：先删后插，事务保证原子性
    await prisma.$transaction(async (tx) => {
      await tx.inventory.deleteMany({ where: { userId } });

      if (validItems.length > 0) {
        await tx.inventory.createMany({
          data: validItems.map((item) => ({
            userId,
            colorId: item.colorId,
            quantity: Math.floor(item.quantity),
          })),
        });
      }
    });

    res.json({ code: 200, message: "同步成功", data: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "同步库存失败";
    console.error("[inventory/sync]", message);
    res.status(500).json({ code: 500, message, data: null });
  }
});

export default router;
