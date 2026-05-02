# Limen-9 心理疗愈终端

Limen-9 心理疗愈终端是一款基于 React 构建的治愈系科幻互动 Web App。玩家将扮演特级心理疏导员 OP-893-X，通过解析患者的残余记忆日志、识别执念类型，并选择合适的干预手段，梳理因过度内耗而产生的“认知结茧”。

> 在这颗星球上，悲伤与内耗不再是无形的。那些未被治愈的心理创伤会析出，化作肉眼可见的“认知丝线”。

## 核心特性

- 治愈系科幻 UI：白金与浅黛色调、毛玻璃、动态光晕和粒子特效。
- 动态粒子与神经雷达：基于 SVG 和状态驱动算法展示情绪波动。
- 医疗 AI 辅助演算：通过打字机效果呈现诊断分析与战术建议。
- 中英双语系统：界面、病例、日志和提示文案支持热切换。
- 响应式双排版：支持桌面 16:9 与移动端 9:16 展示体验。
- 沉浸式 BGM：支持全局背景音乐开关。
- 多回合疗愈玩法：通过诊断、干预和监控完成治疗周期。

## 技术栈

- React：使用 `useState`、`useEffect`、`useMemo`、`useRef` 等 Hooks。
- Vite：用于本地开发和生产构建。
- Tailwind CSS：用于响应式布局、毛玻璃效果和界面样式。
- Lucide React：用于极简科幻风格图标。
- CSS Keyframes：配合 React 状态驱动动画和特效。

## 项目结构

```text
limen9-app/
├── public/
│   └── 水滴与长笛.mp3          # 可选背景音乐，请手动放入
├── src/
│   ├── App.jsx                # 核心 React 应用
│   ├── main.jsx               # 应用入口
│   └── index.css              # Tailwind 与全局样式
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── README.md
└── .gitignore
```

## 本地运行方法

请先确认电脑已经安装 Node.js。

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

## 音频文件说明

如果需要背景音乐，请把 `水滴与长笛.mp3` 放入 `public/` 目录。

如果没有这个文件，项目主体仍然可以运行，只是背景音乐无法播放。代码会在用户打开 BGM 时尝试加载该文件。

## 常见问题

### 页面可以打开但没有音乐

请检查 `public/水滴与长笛.mp3` 是否存在，文件名是否完全一致，包括中文字符。

### 修改后样式没有生效

请确认已经执行 `npm install`，并且 `tailwind.config.js` 的 `content` 包含：

```js
["./index.html", "./src/**/*.{js,jsx,ts,tsx}"]
```

### 构建失败

先执行：

```bash
npm install
npm run build
```

根据终端错误检查 JSX 语法、依赖安装和文件名是否正确。

## GitHub 上传说明

上传前建议确认：

- 不要提交 `node_modules/`。
- 不要提交 `dist/`。
- 不要提交 `.env` 或 `.env.*`。
- 不要提交 Word 原文件 `.docx`。
- 不要提交密码、token、API key 等敏感信息。
- README 已说明音频文件需要手动放入 `public/`。

初始化并上传到 GitHub 的常用流程：

```bash
git init
git branch -M main
git status
git add .
git commit -m "Initial commit"
git remote add origin <你的 GitHub 仓库地址>
git push -u origin main
```

如果需要登录 GitHub，请在浏览器或终端中自行完成认证，不要把密码、token 或验证码写入项目文件或聊天内容。
