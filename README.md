<div align="center">
  <img src="pages/assets/hero.png" width="800" alt="Pretext 封面图">
  <h1>Pretext / 高性能文本排版引擎</h1>
  <p>
    <strong>为现代 Web 打造的高性能多行文本测量与排版引擎。</strong><br />
    <em>纯 JS 驱动，原生支持多语言、高精度、无重排。</em>
  </p>

  <p>
    <a href="https://chenglou.me/pretext">在线体验</a> •
    <a href="#安装">快速安装</a> •
    <a href="#api-参考">API 参考</a> •
    <a href="#离线画报案例">画报预览案例</a>
  </p>
</div>

---

Pretext 是一个纯 JavaScript/TypeScript 编写的多行文本测量与排版引擎。它巧妙地避开了代价高昂的 DOM 操作（如 `getBoundingClientRect` 或 `offsetHeight`），通过内置的测量逻辑与浏览器字体引擎直接交互，确保在处理复杂文本密集型应用时，UI 依然流畅且无布局重排（Layout Reflow）。

## ✨ 核心特性

- **🚀 性能至上**：一次 `prepare()`，到处 `layout()`。在窗口缩放等高频操作下，比 DOM 测量快 200 倍以上。
- **🌍 全球化支持**：原生支持混合 LTR/RTL（阿拉伯语、希伯来语）、中日韩（CJK）避头尾、泰语/老挝语分词以及表情符号（Emoji）。
- **🎨 渲染无感**：排版结果为纯几何数据。可用于 DOM、Canvas、SVG、WebGL 等自定义渲染管线；仓库当前也包含基于浏览器 Canvas 的图片导出 demo。
- **🏗️ 自由布局**：超越简单的流式布局。可用于瀑布流、避障布局、杂志风格排版或文本环绕。

## 📦 安装

```sh
npm install @chenglou/pretext
```

## 🖼️ 离线画报案例 (Markdown Poster Demo)

Pretext 结合我们的 Markdown 块模型，可以将原始文本转化为精美的高清海报，适配 **小红书** (1080x1440) 或长图分享。

### 本地运行
1. `bun install`
2. `bun start`
3. 访问 `http://127.0.0.1:3000/demos/markdown-poster`

### 功能亮点
- **Markdown 块支持**：支持标题、引用、列表、代码块和分割线。
- **主题系统**：内置「莓红杂志」和「墨黑专栏」等配色预设。
- **高清导出**：基于 Canvas 导出 2x / 3x / 4x 高清 PNG。
- **确定性排版**：所有坐标均预先计算，在相同字体与渲染环境下，导出结果更稳定、更可控。

## 📚 API 参考

Pretext 提供两个层级的控制：

### 1. 简单高度计算
适用于列表虚拟化、瀑布流布局或防止页面布局抖动。

```ts
import { prepare, layout } from '@chenglou/pretext'

// 1. 一次性分析与测量（通常在初始化或数据加载时调用）
const prepared = prepare('你好 Pretext! 🚀', '16px Inter')

// 2. 高频布局计算（缩放或渲染循环）—— 纯算数运算，极快！
const { height, lineCount } = layout(prepared, 320, 24) 
```

### 2. 精细化管理
适用于 Canvas/SVG 渲染、浮动文本环绕或实现“收缩包装”效果。

```ts
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const prepared = prepareWithSegments(text, '18px Inter')
const { lines } = layoutWithLines(prepared, 400, 30)

// lines[0] = { text: "...", width: 382.5, start: ..., end: ... }
```

### 🛠️ API 详述

| 函数接口 | 描述 |
| :--- | :--- |
| `prepare(text, font, options?)` | 文本分析与测量阶段。返回不透明的 `PreparedText` 句柄。 |
| `layout(prepared, maxWidth, lineH)` | 热路径高度计算。无 DOM/Canvas 调用。 |
| `prepareWithSegments(...)` | 同 `prepare`，但允许访问详细的行字符串和位移。 |
| `layoutWithLines(...)` | 返回每一行的文本内容、测量宽度以及起止游标；具体 `x/y` 几何位置仍由调用方决定。 |
| `walkLineRanges(...)` | 批量 line 几何遍历，不生成字符串，速度极快。 |
| `layoutNextLine(...)` | 迭代器接口，支持不规则宽度布局（如环绕图片）。 |
| `setLocale(locale?)` | 设置 `Intl.Segmenter` 语言区域并清理共享缓存。 |
| `clearCache()` | 释放所有内部字体宽度和分词缓存。 |

## ⚠️ 注意事项

- **字体一致性**：传给 `prepare` 的 `font` 字符串必须与 CSS `font` 定义完全一致（如 `16px Inter`）。
- **默认策略**：遵循 `white-space: normal`, `word-break: normal`, `overflow-wrap: break-word`。
- **Pre-wrap 模式**：通过 `{ whiteSpace: 'pre-wrap' }` 参数保留空格、制表符和 `\n` 换行。
- **系统字体风险**：在 macOS 上避免使用 `system-ui` 以确保 Canvas 与 DOM 测量对齐；建议使用具名族系。

## 🛠️ 开发与贡献

- 参见 [DEVELOPMENT.md](DEVELOPMENT.md) 了解构建配置与命令。
- 参见 [RESEARCH.md](RESEARCH.md) 了解本项目在浏览器测量兼容性、Emoji 渲染补偿等方面的技术内幕。

## 🛠️ 环境准备与故障排查

如果你在本地运行或安装时遇到问题，可以参考以下操作：

### 1. 安装 Bun (推荐)
本项目优先使用 Bun 作为包管理器和运行时。如果在 Windows 上提示找不到 `bun` 命令，请在 PowerShell 中运行以下命令进行安装：
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```
安装完成后，你可能需要重启终端或将 `C:\Users\你的用户名\.bun\bin` 手动添加到系统的 `PATH` 环境变量中。

### 2. 依赖冲突修复 (ERESOLVE)
如果你使用 `npm install` 时遇到 `oxlint` 相关的 `ERESOLVE` 错误，请确保 `package.json` 中的 `oxlint-tsgolint` 版本已更新至 `^0.19.0` 或更高。

### 3. 使用 npm 替代
如果你暂时无法使用 Bun，也可以使用 `npm` 进行安装，并配合 `tsx` 来运行项目中的 `.ts` 脚本：
```sh
npm install
npx tsx scripts/your-script.ts
```

## 📜 致谢

- **Sebastian Markbage**：设计了最初的测量架构演算法。
- **chenglou**：原作者与核心维护者。
- **jammyfu**：本分支的维护者，开发了 Markdown 生成逻辑。

---

<p align="right">
  为现代 Web 极致性能而生。
</p>
