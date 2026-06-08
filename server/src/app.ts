import express, { type Express } from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
}));
app.use(express.json());

// 健康检查
app.get("/api/health", (_req, res) => {
  res.json({ code: 200, message: "ok", data: null });
});

// 启动服务
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`端口 ${PORT} 已被占用，请更换端口或关闭占用该端口的进程`);
    process.exit(1);
  }
  throw err;
});

export default app;
