# Limen-9 心理疗愈终端

Limen-9 是一个基于 React + Vite 构建的互动式 Web App。项目包含病例选择、诊断、干预、状态反馈、动态图形和可选的 AI 头像生成。

## 技术栈

- React
- Vite
- Tailwind CSS
- Lucide React

## 本地运行

请先安装 Node.js，然后在项目根目录执行：

```bash
npm install
npm run dev
```

启动后访问：

```text
http://localhost:5173
```

普通 `npm run dev` 只启动 Vite 前端。如果要在本地同时测试 `/api/generate-image` 服务端函数，请使用 Vercel CLI 的 `vercel dev`。

## 生产构建

```bash
npm run build
npm run preview
```

## AI 头像 API Key

项目通过 Vercel Serverless Function 代理 Google AI 图片生成请求。真实 Key 读取自服务端环境变量：

```text
GOOGLE_AI_API_KEY
```

本地测试服务端函数时，复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

然后在 `.env` 中填写：

```text
GOOGLE_AI_API_KEY=你的 Google AI API Key
```

不要把 `.env` 上传到 GitHub。

如果没有配置 `GOOGLE_AI_API_KEY`，项目仍然可以运行，只是不会自动生成病例头像。

## Vercel 部署

Vercel 配置已经写在 `vercel.json` 中：

- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`
- Framework: `Vite`

在 Vercel 部署时，请到项目设置中添加环境变量：

```text
GOOGLE_AI_API_KEY
```

路径：

```text
Vercel Project -> Settings -> Environment Variables
```

如果你使用的是 Vercel 连接 GitHub 自动部署，默认应该配置 Vercel 环境变量。GitHub Actions Secrets 只会在你自己写 GitHub Actions 工作流时使用。

不要用 `VITE_GOOGLE_AI_API_KEY` 保存敏感 Key，因为 `VITE_*` 变量会被打包进浏览器端代码。

## GitHub 上传注意事项

必须上传：

- `src/`
- `api/`
- `public/`
- `index.html`
- `package.json`
- `package-lock.json`
- `vite.config.js`
- `tailwind.config.js`
- `postcss.config.js`
- `vercel.json`
- `.env.example`

不要上传：

- `node_modules/`
- `dist/`
- `.env`
- `.env.*`

如果 Vercel 报错 `Rollup failed to resolve import "/src/main.jsx"`，请检查 GitHub 仓库中是否真的存在 `src/main.jsx`。

## 静态音频资源

BGM 文件放在 `public/心流轻语.mp3`，前端通过 `/心流轻语.mp3` 读取。上传到 GitHub 或部署到 Vercel 时，请保留 `public/` 目录和这个 mp3 文件。
