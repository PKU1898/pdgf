import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";

// ── 环境变量（vi.hoisted 保证在 ESM import 之前执行） ──
vi.hoisted(() => {
  process.env.JWT_SECRET = "test-jwt-secret-for-integration";
  process.env.DATABASE_URL =
    process.env.DATABASE_URL_TEST ??
    "postgresql://pdgf:pdgf123@localhost:5432/pdgf_test?schema=public";
  process.env.PORT = "0";
  process.env.WX_APPID = "";
  process.env.WX_SECRET = "";
  process.env.REMOVEBG_API_KEY = "test-removebg-key";
});

// 阻止 dotenv.config() 覆盖 vi.hoisted 设置的环境变量
vi.mock("dotenv", () => ({ default: { config: vi.fn() }, config: vi.fn() }));

// ── Mock 外部依赖 ──

// COS 上传：返回假 URL
vi.mock("../services/cosService.js", () => ({
  uploadImage: vi.fn().mockResolvedValue("https://test-boss.cos.ap-guangzhou.myqcloud.com/test.jpg"),
}));

// sharp 像素化：返回 2x2 像素矩阵
vi.mock("../utils/pixelator.js", () => ({
  pixelateImage: vi.fn().mockResolvedValue([
    [[255, 0, 0], [0, 255, 0]],
    [[0, 0, 255], [128, 128, 128]],
  ]),
}));

// authService：自行实现 JWT 逻辑，mock 微信 API 调用
vi.mock("../services/authService.js", () => {
  const jwt = require("jsonwebtoken");
  const secret = "test-jwt-secret-for-integration";
  return {
    generateToken: (userId: string, isPhoneVerified: boolean) =>
      jwt.sign({ userId, isPhoneVerified }, secret, { expiresIn: "7d" }),
    verifyToken: (token: string) => jwt.verify(token, secret),
    code2Session: vi.fn().mockResolvedValue({ openid: "test_openid_123", sessionKey: "fake_key" }),
    getAccessToken: vi.fn().mockRejectedValue(new Error("测试环境未配置微信")),
    getPhoneNumber: vi.fn().mockRejectedValue(new Error("测试环境未配置微信")),
  };
});

// auth 中间件：模拟真实行为，使用 mock 的 verifyToken
vi.mock("../middleware/auth.js", async () => {
  const authService = await import("../services/authService.js");
  return {
    authMiddleware: (req: Record<string, unknown>, res: { status: (n: number) => { json: (b: unknown) => void } }, next: () => void) => {
      const authHeader = (req.headers as Record<string, string>)?.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ code: 401, message: "未登录", data: null });
        return;
      }
      try {
        const token = authHeader.slice(7);
        const payload = authService.verifyToken(token) as { userId: string; isPhoneVerified: boolean };
        req.userId = payload.userId;
        req.isPhoneVerified = payload.isPhoneVerified;
        next();
      } catch {
        res.status(401).json({ code: 401, message: "Token 无效或已过期", data: null });
      }
    },
    requirePhone: (req: Record<string, unknown>, res: { status: (n: number) => { json: (b: unknown) => void } }, next: () => void) => {
      if (!req.isPhoneVerified) {
        res.status(403).json({ code: 4031, message: "请先绑定手机号", data: null });
        return;
      }
      next();
    },
  };
});

// ── 导入 app 和 prisma（此时 mock 已生效） ──
import app from "../app.js";
import { prisma } from "../lib/prisma.js";
import { generateToken } from "../services/authService.js";

// Mock 全局 fetch 用于 Remove.bg API 测试
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);
vi.stubGlobal("FormData", class MockFormData {
  append() {}
});
vi.stubGlobal("Blob", class MockBlob {
  constructor(public parts: unknown[]) {}
});

// ── 测试数据 ──
const TEST_USER_ID = "integration_test_user";
const TEST_OPENID = "integration_test_openid";
let validToken: string;

async function seedTestUser(): Promise<void> {
  await prisma.user.upsert({
    where: { openId: TEST_OPENID },
    update: {},
    create: { id: TEST_USER_ID, openId: TEST_OPENID, nickname: "测试用户" },
  });
}

async function seedBeadColors(): Promise<void> {
  await prisma.beadColor.createMany({
    data: [
      { id: "test_red", brand: "mard", code: "R01", hexCode: "#FF0000", rgb: "255,0,0", name: "红色" },
      { id: "test_green", brand: "mard", code: "G01", hexCode: "#00FF00", rgb: "0,255,0", name: "绿色" },
      { id: "test_blue", brand: "mard", code: "B01", hexCode: "#0000FF", rgb: "0,0,255", name: "蓝色" },
      { id: "test_gray", brand: "mard", code: "GR01", hexCode: "#808080", rgb: "128,128,128", name: "灰色" },
    ],
    skipDuplicates: true,
  });
}

async function cleanupDatabase(): Promise<void> {
  await prisma.inventory.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.beadColor.deleteMany({});
  await prisma.user.deleteMany({});
}

beforeAll(async () => {
  await cleanupDatabase();
  await seedTestUser();
  await seedBeadColors();
  validToken = generateToken(TEST_USER_ID, true);
}, 15000);

afterAll(async () => {
  await cleanupDatabase();
  await prisma.$disconnect();
}, 10000);

// ═══════════════════════════════════════════════════════
// 鉴权测试
// ═══════════════════════════════════════════════════════
describe("鉴权中间件", () => {
  it("未携带 Token 访问受保护接口返回 401", async () => {
    const res = await request(app).get("/api/project/list");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(401);
    expect(res.body.message).toContain("未登录");
  });

  it("携带无效 Token 返回 401", async () => {
    const res = await request(app)
      .get("/api/project/list")
      .set("Authorization", "Bearer invalid.token.here");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe(401);
    expect(res.body.message).toContain("Token");
  });

  it("携带有效 Token 正常通过鉴权", async () => {
    const res = await request(app)
      .get("/api/project/list")
      .set("Authorization", `Bearer ${validToken}`);
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════
// POST /api/inventory/sync — 参数校验
// ═══════════════════════════════════════════════════════
describe("POST /api/inventory/sync", () => {
  it("未携带 Token 返回 401", async () => {
    const res = await request(app)
      .post("/api/inventory/sync")
      .send({ items: [{ colorId: "red_01", quantity: 10 }] });
    expect(res.status).toBe(401);
  });

  it("items 不是数组返回 400", async () => {
    const res = await request(app)
      .post("/api/inventory/sync")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ items: "not-an-array" });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("参数格式错误");
  });

  it("缺少 items 字段返回 400", async () => {
    const res = await request(app)
      .post("/api/inventory/sync")
      .set("Authorization", `Bearer ${validToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("单色库存超过 9999 返回 400", async () => {
    const res = await request(app)
      .post("/api/inventory/sync")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ items: [{ colorId: "red_01", quantity: 10000 }] });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("9999");
  });

  it("正常同步库存返回 200", async () => {
    const res = await request(app)
      .post("/api/inventory/sync")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ items: [{ colorId: "red_01", quantity: 50 }, { colorId: "blue_02", quantity: 100 }] });
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);

    const inventories = await prisma.inventory.findMany({ where: { userId: TEST_USER_ID } });
    expect(inventories).toHaveLength(2);
    expect(inventories.find((i) => i.colorId === "red_01")?.quantity).toBe(50);
  });

  it("负数库存被过滤（quantity <= 0 的项不入库）", async () => {
    const res = await request(app)
      .post("/api/inventory/sync")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ items: [{ colorId: "red_01", quantity: -5 }, { colorId: "blue_02", quantity: 30 }] });
    expect(res.status).toBe(200);

    const inventories = await prisma.inventory.findMany({ where: { userId: TEST_USER_ID } });
    expect(inventories).toHaveLength(1);
    expect(inventories[0].colorId).toBe("blue_02");
  });
});

// ═══════════════════════════════════════════════════════
// POST /api/project/generate — 核心流程
// ═══════════════════════════════════════════════════════
describe("POST /api/project/generate", () => {
  it("未携带 Token 返回 401", async () => {
    const res = await request(app)
      .post("/api/project/generate")
      .field("name", "测试图纸")
      .field("width", "2")
      .field("height", "2")
      .attach("file", Buffer.from("fake-image-data"), "test.png");
    expect(res.status).toBe(401);
  });

  it("未上传文件返回 400", async () => {
    const res = await request(app)
      .post("/api/project/generate")
      .set("Authorization", `Bearer ${validToken}`)
      .field("name", "测试图纸");
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("图片");
  });

  it("宽高超出范围返回 400", async () => {
    const res = await request(app)
      .post("/api/project/generate")
      .set("Authorization", `Bearer ${validToken}`)
      .field("width", "300")
      .field("height", "10")
      .attach("file", Buffer.from("fake-image-data"), {
        filename: "test.png",
        contentType: "image/png",
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("10-200");
  });

  it("正常生成图纸，数据库写入 Project 记录", async () => {
    const res = await request(app)
      .post("/api/project/generate")
      .set("Authorization", `Bearer ${validToken}`)
      .field("name", "测试图纸")
      .field("width", "10")
      .field("height", "10")
      .field("brand", "mard")
      .attach("file", Buffer.from("fake-image-data"), {
        filename: "test.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.data.projectId).toBeDefined();
    expect(res.body.data.gridData).toBeDefined();
    expect(res.body.data.imageUrl).toContain("cos");

    const project = await prisma.project.findUnique({
      where: { id: res.body.data.projectId },
    });
    expect(project).not.toBeNull();
    expect(project!.userId).toBe(TEST_USER_ID);
    expect(project!.name).toBe("测试图纸");
    expect(project!.width).toBe(10);
    expect(project!.height).toBe(10);
    expect(project!.brand).toBe("mard");
  });
});

// ═══════════════════════════════════════════════════════
// GET /api/project/list — 列表分页
// ═══════════════════════════════════════════════════════
describe("GET /api/project/list", () => {
  it("返回图纸列表和分页信息", async () => {
    const res = await request(app)
      .get("/api/project/list")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.list).toBeDefined();
    expect(res.body.data.total).toBeDefined();
    expect(Array.isArray(res.body.data.list)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════
// GET /api/project/:id — 详情 + 权限校验
// ═══════════════════════════════════════════════════════
describe("GET /api/project/:id", () => {
  it("查询不存在的图纸返回 404", async () => {
    const res = await request(app)
      .get("/api/project/non_existent_id")
      .set("Authorization", `Bearer ${validToken}`);
    expect(res.status).toBe(404);
  });

  it("查询自己的图纸返回 200", async () => {
    const project = await prisma.project.create({
      data: {
        userId: TEST_USER_ID,
        name: "详情测试",
        width: 2,
        height: 2,
        brand: "mard",
        gridData: [["A", "B"], ["C", "D"]],
      },
    });

    const res = await request(app)
      .get(`/api/project/${project.id}`)
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(project.id);
    expect(res.body.data.name).toBe("详情测试");
  });
});

// ═══════════════════════════════════════════════════════
// PUT /api/project/:id — 更新 + 权限校验
// ═══════════════════════════════════════════════════════
describe("PUT /api/project/:id", () => {
  it("更新不存在的图纸返回 403", async () => {
    const res = await request(app)
      .put("/api/project/non_existent_id")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ name: "新名字" });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe(3001);
  });

  it("正常更新图纸名称", async () => {
    const project = await prisma.project.create({
      data: {
        userId: TEST_USER_ID,
        name: "原始名称",
        width: 2,
        height: 2,
        brand: "mard",
        gridData: [["A", "B"], ["C", "D"]],
      },
    });

    const res = await request(app)
      .put(`/api/project/${project.id}`)
      .set("Authorization", `Bearer ${validToken}`)
      .send({ name: "更新后名称" });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);

    const updated = await prisma.project.findUnique({ where: { id: project.id } });
    expect(updated!.name).toBe("更新后名称");
  });

  it("gridData 格式无效返回 400", async () => {
    const project = await prisma.project.create({
      data: {
        userId: TEST_USER_ID,
        name: "格式测试",
        width: 2,
        height: 2,
        brand: "mard",
        gridData: [["A", "B"], ["C", "D"]],
      },
    });

    const res = await request(app)
      .put(`/api/project/${project.id}`)
      .set("Authorization", `Bearer ${validToken}`)
      .send({ gridData: "not-an-array" });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("gridData");
  });
});

// ═══════════════════════════════════════════════════════
// POST /api/tool/matting — AI 抠图
// ═══════════════════════════════════════════════════════
describe("POST /api/tool/matting", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("未携带 Token 返回 401", async () => {
    const res = await request(app)
      .post("/api/tool/matting")
      .send({ imageBase64: Buffer.from("fake-image").toString("base64") });
    expect(res.status).toBe(401);
  });

  it("缺少 imageBase64 返回 400", async () => {
    const res = await request(app)
      .post("/api/tool/matting")
      .set("Authorization", `Bearer ${validToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("图片");
  });

  it("图片超过 5MB 返回 400", async () => {
    // 8MB base64 string decodes to ~6MB buffer
    const largeBase64 = "A".repeat(8 * 1024 * 1024);
    const res = await request(app)
      .post("/api/tool/matting")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ imageBase64: largeBase64 });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("5MB");
  });

  it("Remove.bg API 失败返回 502", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 402,
      text: () => Promise.resolve("Insufficient credits"),
    });

    const fakeImage = Buffer.from("fake-image-data").toString("base64");
    const res = await request(app)
      .post("/api/tool/matting")
      .set("Authorization", `Bearer ${validToken}`)
      .send({ imageBase64: fakeImage });

    expect(res.status).toBe(502);
    expect(res.body.code).toBe(5002);
    expect(res.body.message).toContain("抠图失败");
  });

  it("成功抠图返回 imageUrl 和 gridData", async () => {
    // Mock Remove.bg 返回透明 PNG
    const transparentPng = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG magic bytes
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: () => Promise.resolve(transparentPng.buffer),
    });

    const fakeImage = Buffer.from("fake-image-data").toString("base64");
    const res = await request(app)
      .post("/api/tool/matting")
      .set("Authorization", `Bearer ${validToken}`)
      .send({
        imageBase64: fakeImage,
        width: "10",
        height: "10",
        brand: "mard",
      });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.data.imageUrl).toContain("cos");
    expect(res.body.data.gridData).toBeDefined();
    expect(Array.isArray(res.body.data.gridData)).toBe(true);
  });

  it("支持 data URL 前缀格式", async () => {
    const transparentPng = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: () => Promise.resolve(transparentPng.buffer),
    });

    const res = await request(app)
      .post("/api/tool/matting")
      .set("Authorization", `Bearer ${validToken}`)
      .send({
        imageBase64: "data:image/png;base64," + Buffer.from("fake").toString("base64"),
      });

    expect(res.status).toBe(200);
  });
});
