# Limen-9 心理疗愈终端

Limen-9 是一个基于 React + Vite 构建的互动式 Web App，包含病例选择、诊断、干预、状态反馈、动态可视化和静态人物头像。

## 本地运行

```bash
npm install
npm run dev
```

启动后访问：

```text
http://localhost:5173
```

## 生产构建

```bash
npm run build
npm run preview
```

## 静态人物图

三个内置病例优先使用 `public/` 下的本地静态图片：

- `case-2904-r.svg`
- `case-8131-f.svg`
- `case-4402-s.svg`

前端正常启动时不需要调用图片生成服务。`src/staticImageFallback.js` 也会把旧版预加载逻辑中的 `/api/generate-image` 请求短路到这些静态图片，避免 Vercel 部署后浏览器继续请求图片生成 API。

## 可选图片生成 API

`api/generate-image.js` 仍可作为以后新增病例时的可选服务端接口。只有主动测试或新增无静态图的病例时才需要配置：

```text
GOOGLE_AI_API_KEY
```

不要使用 `VITE_GOOGLE_AI_API_KEY` 保存敏感 Key，因为 `VITE_*` 会被打包到浏览器端。

## Vercel 部署

项目使用 Vite 配置：

- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`
- Framework: `Vite`

这些配置已经写入 `vercel.json`。

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

BGM 文件位于 `public/心流轻语.mp3`，前端通过 `/心流轻语.mp3` 加载。
