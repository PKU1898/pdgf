# 项目信息
项目名称：拼豆工坊
技术栈：
- 前端：Uni-app (Vue3 + Vite) + TypeScript + Tailwind CSS + Pinia
- 后端：Node.js (Express) + TypeScript + Prisma
- 数据库：PostgreSQL (通过 Prisma ORM 操作)
- 存储：腾讯云 COS (图片存储)
- 包管理：pnpm (前后端均使用)

小程序基础库从 3.7.0 起正式支持 HarmonyOS 平台，开发者可通过 wx.getDeviceInfo() 判断平台进行兼容处理，让小程序在 HarmonyOS 也获得最佳体验

# 常用命令
## 前端 (在 /miniapp 目录下)
- pnpm dev:mp-weixin    # 启动微信小程序开发模式
- pnpm build:mp-weixin  # 构建微信小程序生产版本

## 后端 (在 /server 目录下)
- pnpm dev               # 启动开发服务器 (热重载)
- pnpm build             # 编译 TypeScript 到 dist
- pnpm start             # 运行生产版本
- npx prisma studio      # 打开数据库可视化管理界面
- npx prisma migrate dev # 运行数据库迁移
- npx prisma generate    # 生成 Prisma Client

# 编码规范与红线（绝对不能违反）
- 前端组件必须使用 Vue3 `<script setup lang="ts">` 语法。
- 后端接口统一返回格式：`{ code: number, message: string, data: any }`。
- 数据库操作一律通过 `prisma client`，禁止手写 SQL 查询。
- 前端状态管理使用 Pinia，按模块划分 store。
- 所有异步操作必须使用 try-catch 捕获异常，禁止空 catch 块（至少 console.error）。
- 样式优先使用 Tailwind CSS 类名，严格使用设计规范中定义的 token (如 `bg-bg`, `text-primary`)。
- **红线1：禁止使用小程序 Canvas API 进行图纸画板的编辑渲染！** 必须使用 CSS Grid + Div 实现，只在最终“导出图片”时使用离屏 Canvas。
- **红线2：禁止在前端代码中暴露任何后端密钥**（COS SecretKey、JWT Secret等），必须走后端 API 代理。
- **红线3：禁止将大图直接读入 Node.js 内存进行像素遍历**，必须使用 `sharp` 库的流式处理和区域提取。
- **红线4：禁止提交 `.env` 文件到 Git**，只提供 `.env.example`。
- **红线5：禁止使用 `any` 类型**，如类型未知必须使用 `unknown` 并进行类型守卫。


每次完成task需要审查代码，重点关注三件事：

• 这段代码做的是不是我要的？
• 有没有明显的错误？
• 有没有违反CLAUDE.md里的红线？



如果有不清楚的内容，参考"D:\workspace\code\xcx\pdgf\doc"以及"D:\workspace\code\xcx\pdgf\技术设计文档.md"