# MagicMagMark

独立的 Markdown 精细排版项目，基于当前仓库的 Pretext 行布局逻辑实现。

它不是继续挂在 demo 里的页面，而是一个可以单独运行的前端项目，目标是把 MagMark 风格的内容生产流程收敛成一个更聚焦的工具：
- 导入 Markdown
- 排成小红书卡片或长图
- 导出高分辨率 PNG

## 特点

- 复用当前仓库 `src/layout.ts` 的行布局能力
- 使用 `prepareWithSegments()` + `layoutNextLine()` 做逐行排版
- 支持标题、段落、引用、列表、代码块、分隔线、图片占位块
- 支持小红书 `1080 x 1440` 多页图
- 支持 `1080 x auto` 长图
- 支持 `2x / 3x / 4x` PNG 导出

## 目录

- [index.html](./index.html)
- [src/main.ts](./src/main.ts)
- [src/engine.ts](./src/engine.ts)
- [src/styles.css](./src/styles.css)

## 运行

```sh
cd magic-magmark
npm install
npm run dev
```

默认地址：

```txt
http://127.0.0.1:4173
```

## 实现逻辑

1. Markdown 先被解析成轻量块模型。
2. 每个块再拆成带样式的 inline spans。
3. 每种字体样式通过 Pretext 做一次 `prepareWithSegments()`。
4. 用 `layoutNextLine()` 逐行求出文本在目标宽度下的换行结果。
5. 生成明确的 `x / y / width / height` 几何数据。
6. 小红书模式下做固定页高分页，长图模式下直接累积总高度。
7. 最终使用 Canvas 绘制并导出 PNG。

## 当前边界

- Markdown 图片先渲染为占位块，不读取本地图片内容
- 没有实现微信公众号 HTML 内嵌排版
- 目前重点是图文排版与图片导出链路
