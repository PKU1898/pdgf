import express, { type Request, type Response } from "express";
import { prisma } from "../lib/prisma.js";
import {
  code2Session,
  getAccessToken,
  getPhoneNumber,
  generateToken,
  verifyToken,
} from "../services/authService.js";

const router: express.Router = express.Router();

// POST /api/auth/silent-login
router.post("/silent-login", async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== "string") {
      res.status(400).json({ code: 400, message: "缺少 code 参数", data: null });
      return;
    }

    const { openid } = await code2Session(code);

    const user = await prisma.user.upsert({
      where: { openId: openid },
      update: {},
      create: { openId: openid },
    });

    const isPhoneVerified = !!user.phone;
    const token = generateToken(user.id, isPhoneVerified);

    res.json({
      code: 200,
      message: "ok",
      data: {
        token,
        isPhoneVerified,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          phone: user.phone ? user.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") : null,
          vipStatus: user.vipStatus,
          currentBrand: user.currentBrand,
        },
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "微信登录失败";
    console.error("[silent-login]", message);
    res.status(500).json({ code: 1001, message, data: null });
  }
});

// POST /api/auth/bind-phone (需要 JWT 鉴权)
router.post("/bind-phone", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ code: 401, message: "未登录", data: null });
      return;
    }

    const token = authHeader.slice(7);
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      res.status(401).json({ code: 401, message: "Token 无效或已过期", data: null });
      return;
    }

    const { phoneCode } = req.body;
    if (!phoneCode || typeof phoneCode !== "string") {
      res.status(400).json({ code: 400, message: "缺少 phoneCode 参数", data: null });
      return;
    }

    const accessToken = await getAccessToken();
    const phoneNumber = await getPhoneNumber(accessToken, phoneCode);

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: { phone: phoneNumber },
    });

    const newToken = generateToken(user.id, true);

    res.json({
      code: 200,
      message: "ok",
      data: {
        token: newToken,
        isPhoneVerified: true,
        user: {
          id: user.id,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          phone: user.phone!.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2"),
          vipStatus: user.vipStatus,
          currentBrand: user.currentBrand,
        },
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "绑定手机号失败";
    console.error("[bind-phone]", message);

    if (message.includes("Session过期")) {
      res.status(500).json({ code: 1002, message, data: null });
      return;
    }

    res.status(500).json({ code: 1003, message, data: null });
  }
});

export default router;
