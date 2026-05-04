# Limen-9 部署说明

## 1. GitHub 网页端上传

通过 GitHub 网页上传时，请上传整个项目内容，尤其不要漏掉 `src/` 目录。

必须包含：

- `index.html`
- `package.json`
- `package-lock.json`
- `vite.config.js`
- `tailwind.config.js`
- `postcss.config.js`
- `vercel.json`
- `.env.example`
- `api/generate-image.js`
- `src/App.jsx`
- `src/main.jsx`
- `src/index.css`
- `public/`

不要上传：

- `node_modules/`
- `dist/`
- `.env`
- `.env.*`

如果 Vercel 报错：

```text
Rollup failed to resolve import "/src/main.jsx" from "/vercel/path0/index.html"
```

通常说明 GitHub 仓库里缺少 `src/main.jsx`，或者上传时漏掉了整个 `src/` 文件夹。

## 2. Vercel 部署配置

这个项目是 Vite React 前端项目，Vercel 使用以下配置：

- Framework Preset: `Vite`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

这些配置已经写入 `vercel.json`。

## 3. API Key 配置

代码会通过 Vercel Serverless Function 读取服务端环境变量：

```text
GOOGLE_AI_API_KEY
```

本地测试时：

1. 复制 `.env.example` 为 `.env`
2. 在 `.env` 中填写：

```text
GOOGLE_AI_API_KEY=你的 Google AI API Key
```

3. 运行：

```bash
npm install
npm run dev
```

普通 `npm run dev` 只启动 Vite 前端。如果要在本地同时测试 `/api/generate-image` 服务端函数，请使用 Vercel CLI 的 `vercel dev`。

部署到 Vercel 时，请在 Vercel 项目的环境变量里添加：

```text
GOOGLE_AI_API_KEY
```

路径通常是：

```text
Vercel Project -> Settings -> Environment Variables
```

如果你使用 GitHub Actions 自己构建或部署，也可以在 GitHub 仓库中配置同名 Secret：

```text
Repository -> Settings -> Secrets and variables -> Actions -> New repository secret
```

但注意：Vercel 从 GitHub 自动部署时，默认读取的是 Vercel 项目环境变量，不会自动读取 GitHub Actions Secrets。

## 4. 安全提醒

不要把真实 API Key 写进代码，也不要提交 `.env` 文件。

前端代码不要使用 `VITE_GOOGLE_AI_API_KEY` 保存敏感 Key，因为 `VITE_*` 变量会被 Vite 暴露给浏览器端代码。本项目已经改成 `/api/generate-image` 服务端代理，真实 Key 只放在服务端环境变量 `GOOGLE_AI_API_KEY` 中。

## 5. BGM 静态资源

BGM 文件为 `public/心流轻语.mp3`，前端通过 `/心流轻语.mp3` 加载。上传 GitHub 或触发 Vercel 部署时，不要漏掉 `public/` 目录。
