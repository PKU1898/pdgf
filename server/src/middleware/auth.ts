import { type Request, type Response, type NextFunction } from "express";
import { verifyToken } from "../services/authService.js";

interface AuthenticatedRequest extends Request {
  userId?: string;
  isPhoneVerified?: boolean;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ code: 401, message: "未登录", data: null });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    req.isPhoneVerified = payload.isPhoneVerified;
    next();
  } catch {
    res.status(401).json({ code: 401, message: "Token 无效或已过期", data: null });
  }
}

export function requirePhone(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.isPhoneVerified) {
    res.status(403).json({ code: 4031, message: "请先绑定手机号", data: null });
    return;
  }
  next();
}
