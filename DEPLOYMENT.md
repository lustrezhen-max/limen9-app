# Limen-9 部署说明

## 1. 必须包含的文件

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
- `src/staticImageFallback.js`
- `src/index.css`
- `public/`

人物图必须包含以下静态文件：

- `public/case-2904-r.svg`
- `public/case-8131-f.svg`
- `public/case-4402-s.svg`

## 2. 不要上传

- `node_modules/`
- `dist/`
- `.env`
- `.env.*`

## 3. Vercel 配置

这是 Vite React 项目，Vercel 使用：

- Framework Preset: `Vite`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

这些配置已经写入 `vercel.json`。

## 4. 图片 API 状态

内置病例头像现在从 `public/` 静态图片读取。前端入口 `src/main.jsx` 会安装 `src/staticImageFallback.js`，把旧版 `/api/generate-image` 预加载请求直接转换为本地静态图片响应，避免浏览器在 Vercel 部署后继续调用图片生成 API。

`api/generate-image.js` 可以保留为未来新增病例的可选服务端接口。只有需要真实生成新图片时才配置 `GOOGLE_AI_API_KEY`。

## 5. 常见部署错误

如果 Vercel 报错：

```text
Rollup failed to resolve import "/src/main.jsx" from "/vercel/path0/index.html"
```

通常说明 GitHub 仓库中缺少 `src/main.jsx`，或者上传时漏掉了整个 `src/` 文件夹。
