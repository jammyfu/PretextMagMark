import { layoutNextLine, prepareWithSegments, type LayoutCursor, type PreparedTextWithSegments } from '../../src/layout.ts'

export type PresetKey = 'xiaohongshu' | 'long-image'
export type ThemeKey = 'berry' | 'ink'
export type OrnamentKey = 'editorial' | 'minimal'

type InlineStyleName =
  | 'body'
  | 'strong'
  | 'em'
  | 'code'
  | 'link'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'quote'
  | 'caption'
  | 'list-prefix'

type MarkdownBlock =
  | { kind: 'heading'; depth: 1 | 2 | 3; spans: InlineSpan[] }
  | { kind: 'paragraph'; spans: InlineSpan[] }
  | { kind: 'blockquote'; spans: InlineSpan[] }
  | { kind: 'list'; ordered: boolean; items: InlineSpan[][] }
  | { kind: 'code'; code: string }
  | { kind: 'divider' }
  | { kind: 'image'; alt: string; url: string }

type InlineSpan = {
  text: string
  style: 'body' | 'strong' | 'em' | 'code' | 'link'
}

type TextStyle = {
  font: string
  color: string
  lineHeight: number
  gapWidth: number
  inlinePaddingX: number
  inlineBackground?: string
  underline?: boolean
}

type Theme = {
  name: string
  background: string
  pageFill: string
  pageEdge: string
  ink: string
  muted: string
  accent: string
  accentSoft: string
  accentFaint: string
  rule: string
  styles: Record<InlineStyleName, TextStyle>
}

type Preset = {
  label: string
  pageWidth: number
  pageHeight: number | null
  marginX: number
  topInset: number
  bottomInset: number
  contentWidth: number
}

type TextFragment = {
  text: string
  styleName: InlineStyleName
  width: number
  leadingGap: number
}

type TextRow = {
  kind: 'text'
  y: number
  height: number
  x: number
  prefix?: {
    text: string
    styleName: InlineStyleName
    width: number
  }
  fragments: TextFragment[]
  tone?: 'quote' | 'code'
}

type DividerRow = {
  kind: 'divider'
  y: number
  height: number
}

type ImageRow = {
  kind: 'image'
  y: number
  height: number
  alt: string
  url: string
}

type RenderRow = TextRow | DividerRow | ImageRow

export type PageLayout = {
  rows: RenderRow[]
  height: number
}

export type RenderDocument = {
  preset: Preset
  theme: Theme
  pages: PageLayout[]
  blockCount: number
  sourceLength: number
}

type TextInlineItem = {
  styleName: InlineStyleName
  prepared: PreparedTextWithSegments
  endCursor: LayoutCursor
  fullText: string
  fullWidth: number
  leadingGap: number
  chromeWidth: number
}

type PreparedLineFragment = {
  styleName: InlineStyleName
  text: string
  width: number
  leadingGap: number
}

type PreparedLine = {
  fragments: PreparedLineFragment[]
}

export const SAMPLE_MARKDOWN = `# MagicMagMark：把 Markdown 变成可发布内容

同一份 Markdown，可以直接排成小红书多页卡片，或者导出成长图。

## 现在已经具备的能力

- 导入本地 \`.md\` 文件
- 自动分页为 1080×1440 小红书卡片
- 自动生成 1080×Auto 长图
- 以 2x / 3x / 4x 导出 PNG

> 这个独立项目延续了当前仓库的 Pretext 排版思路：先分析文本，再逐行布局，最后把所有几何结果画到 Canvas 上。

## 推荐内容结构

1. 经验总结
2. 知识清单
3. 产品方案说明
4. 课程讲义节选

---

### 图片说明

如果 Markdown 中包含：

\`\`\`md
![封面说明](./cover.png)
\`\`\`

当前会先渲染为占位块，帮助你确认版面节奏。`

const PRESETS: Record<PresetKey, Preset> = {
  xiaohongshu: {
    label: '小红书 1080×1440',
    pageWidth: 1080,
    pageHeight: 1440,
    marginX: 88,
    topInset: 120,
    bottomInset: 110,
    contentWidth: 1080 - 176,
  },
  'long-image': {
    label: '长图 1080×Auto',
    pageWidth: 1080,
    pageHeight: null,
    marginX: 92,
    topInset: 120,
    bottomInset: 120,
    contentWidth: 1080 - 184,
  },
}

const preparedCache = new Map<string, PreparedTextWithSegments>()
const collapsedSpaceWidthCache = new Map<string, number>()

const THEMES: Record<ThemeKey, Theme> = {
  berry: createTheme({
    name: '莓红杂志',
    background: '#f7ead8',
    pageFill: '#fff9f1',
    pageEdge: '#f2e4d7',
    ink: '#271816',
    muted: '#7f6258',
    accent: '#d24f39',
    accentSoft: '#f6d3c4',
    accentFaint: '#faeee6',
    rule: '#e8d7cb',
  }),
  ink: createTheme({
    name: '墨黑专栏',
    background: '#dbd3c7',
    pageFill: '#faf7f1',
    pageEdge: '#e9e1d7',
    ink: '#191615',
    muted: '#6d655e',
    accent: '#7b3327',
    accentSoft: '#e6ccc4',
    accentFaint: '#f2eae6',
    rule: '#ddd4ca',
  }),
}

export function buildRenderDocument(
  source: string,
  presetKey: PresetKey,
  themeKey: ThemeKey,
): RenderDocument {
  const preset = PRESETS[presetKey]
  const theme = THEMES[themeKey]
  const blocks = parseMarkdown(source)
  const rows = layoutBlocks(blocks, preset, theme)
  const pages = preset.pageHeight === null
    ? [{
        rows: rows.map(cloneRow),
        height: Math.max(rows.length === 0 ? 960 : computeDocumentHeight(rows) + preset.bottomInset, 960),
      }]
    : paginateRows(rows, preset)

  return {
    preset,
    theme,
    pages,
    blockCount: blocks.length,
    sourceLength: source.length,
  }
}

export async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return await new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob === null) {
        reject(new Error('Failed to create image blob'))
        return
      }
      resolve(blob)
    }, 'image/png')
  })
}

export function sanitizeStem(name: string): string {
  const trimmed = name.trim()
  if (trimmed.length === 0) return 'magic-magmark'
  return trimmed.replace(/[<>:"/\\|?*\u0000-\u001F]+/g, '-')
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function drawPageToCanvas(
  canvas: HTMLCanvasElement,
  page: PageLayout,
  doc: RenderDocument,
  scale: number,
  ornament: OrnamentKey,
): void {
  const width = doc.preset.pageWidth
  const height = Math.max(1, Math.round(page.height))
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  canvas.style.aspectRatio = `${width} / ${height}`
  const ctx = canvas.getContext('2d')
  if (ctx === null) throw new Error('2D context not available')
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  drawPage(ctx, width, height, page, doc, ornament)
}

function drawPage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  page: PageLayout,
  doc: RenderDocument,
  ornament: OrnamentKey,
): void {
  const { theme, preset } = doc
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = theme.background
  ctx.fillRect(0, 0, width, height)

  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, theme.pageFill)
  gradient.addColorStop(1, theme.pageEdge)
  ctx.fillStyle = gradient
  roundRect(ctx, 28, 28, width - 56, height - 56, 34)
  ctx.fill()

  if (ornament === 'editorial') {
    ctx.fillStyle = theme.accentSoft
    ctx.beginPath()
    ctx.arc(width - 118, 116, 44, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(preset.marginX, 92, 120, 6)
  } else {
    ctx.strokeStyle = theme.rule
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(preset.marginX, 98)
    ctx.lineTo(width - preset.marginX, 98)
    ctx.stroke()
  }

  ctx.fillStyle = theme.muted
  ctx.font = `700 16px "Consolas", "SFMono-Regular", ui-monospace, monospace`
  ctx.fillText('MAGIC MAGMARK', preset.marginX, 82)
  ctx.textAlign = 'right'
  ctx.fillText(doc.preset.label, width - preset.marginX, 82)
  ctx.textAlign = 'left'

  for (let index = 0; index < page.rows.length; index++) {
    const row = page.rows[index]!
    if (row.kind === 'text') drawTextRow(ctx, row, doc)
    if (row.kind === 'divider') drawDividerRow(ctx, row, doc)
    if (row.kind === 'image') drawImageRow(ctx, row, doc)
  }

  ctx.fillStyle = theme.muted
  ctx.font = `500 18px "PingFang SC", "Segoe UI", sans-serif`
  ctx.fillText('Markdown -> Pretext -> Canvas PNG', preset.marginX, height - 54)
}

function drawTextRow(ctx: CanvasRenderingContext2D, row: TextRow, doc: RenderDocument): void {
  const { theme, preset } = doc

  if (row.tone === 'quote') {
    ctx.fillStyle = theme.accentFaint
    roundRect(ctx, preset.marginX - 6, row.y - 10, preset.contentWidth + 12, row.height + 12, 18)
    ctx.fill()
    ctx.fillStyle = theme.accent
    roundRect(ctx, preset.marginX - 18, row.y - 10, 8, row.height + 12, 6)
    ctx.fill()
  }

  if (row.tone === 'code') {
    ctx.fillStyle = '#f2ede7'
    roundRect(ctx, preset.marginX - 2, row.y - 6, preset.contentWidth + 4, row.height + 8, 18)
    ctx.fill()
  }

  let cursorX = row.x
  if (row.prefix !== undefined) {
    const styleSpec = theme.styles[row.prefix.styleName]
    ctx.font = styleSpec.font
    ctx.fillStyle = styleSpec.color
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(row.prefix.text, preset.marginX, row.y + row.height * 0.76)
  }

  for (let index = 0; index < row.fragments.length; index++) {
    const fragment = row.fragments[index]!
    const styleSpec = theme.styles[fragment.styleName]
    cursorX += fragment.leadingGap

    if (styleSpec.inlineBackground !== undefined) {
      ctx.fillStyle = styleSpec.inlineBackground
      roundRect(
        ctx,
        cursorX - styleSpec.inlinePaddingX,
        row.y + row.height * 0.17,
        fragment.width + styleSpec.inlinePaddingX * 2,
        row.height * 0.58,
        14,
      )
      ctx.fill()
    }

    ctx.font = styleSpec.font
    ctx.fillStyle = styleSpec.color
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(fragment.text, cursorX, row.y + row.height * 0.76)

    if (styleSpec.underline) {
      ctx.strokeStyle = styleSpec.color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(cursorX, row.y + row.height * 0.84)
      ctx.lineTo(cursorX + fragment.width, row.y + row.height * 0.84)
      ctx.stroke()
    }

    cursorX += fragment.width
  }
}

function drawDividerRow(ctx: CanvasRenderingContext2D, row: DividerRow, doc: RenderDocument): void {
  ctx.strokeStyle = doc.theme.rule
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(doc.preset.marginX, row.y + 16)
  ctx.lineTo(doc.preset.marginX + doc.preset.contentWidth, row.y + 16)
  ctx.stroke()
}

function drawImageRow(ctx: CanvasRenderingContext2D, row: ImageRow, doc: RenderDocument): void {
  const { preset, theme } = doc
  ctx.fillStyle = theme.accentFaint
  roundRect(ctx, preset.marginX, row.y, preset.contentWidth, row.height, 28)
  ctx.fill()
  ctx.strokeStyle = theme.rule
  ctx.lineWidth = 2
  roundRect(ctx, preset.marginX, row.y, preset.contentWidth, row.height, 28)
  ctx.stroke()
  ctx.fillStyle = theme.accent
  ctx.font = `700 24px "Consolas", "SFMono-Regular", ui-monospace, monospace`
  ctx.fillText('IMAGE PLACEHOLDER', preset.marginX + 32, row.y + 54)
  ctx.fillStyle = theme.ink
  ctx.font = doc.theme.styles['h3'].font
  ctx.fillText(row.alt.length > 0 ? row.alt : '未提供图片说明', preset.marginX + 32, row.y + 114)
  ctx.fillStyle = theme.muted
  ctx.font = doc.theme.styles['caption'].font
  wrapCanvasText(
    ctx,
    row.url,
    preset.marginX + 32,
    row.y + 160,
    preset.contentWidth - 64,
    doc.theme.styles['caption'].lineHeight,
  )
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): void {
  const words = text.split(/\s+/)
  let line = ''
  let lineIndex = 0
  for (let index = 0; index < words.length; index++) {
    const word = words[index]!
    const candidate = line.length === 0 ? word : `${line} ${word}`
    if (ctx.measureText(candidate).width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, y + lineIndex * lineHeight)
      line = word
      lineIndex++
    } else {
      line = candidate
    }
  }
  if (line.length > 0) ctx.fillText(line, x, y + lineIndex * lineHeight)
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

function layoutBlocks(blocks: MarkdownBlock[], preset: Preset, theme: Theme): RenderRow[] {
  const rows: RenderRow[] = []
  let y = preset.topInset
  for (let index = 0; index < blocks.length; index++) {
    const result = layoutBlock(blocks[index]!, preset.marginX, preset.contentWidth, y, theme)
    rows.push(...result.rows)
    y = result.nextY
  }
  return rows
}

function layoutBlock(
  block: MarkdownBlock,
  x: number,
  maxWidth: number,
  startY: number,
  theme: Theme,
): { rows: RenderRow[], nextY: number } {
  switch (block.kind) {
    case 'heading': {
      const styleName = block.depth === 1 ? 'h1' : block.depth === 2 ? 'h2' : 'h3'
      const gapBefore = block.depth === 1 ? 0 : 34
      const lines = layoutSpans(block.spans, styleName, maxWidth, theme)
      const rows = createTextRows(lines, x, startY + gapBefore, theme, styleName)
      const endY = rows.length === 0 ? startY + gapBefore : rows[rows.length - 1]!.y + rows[rows.length - 1]!.height
      return { rows, nextY: endY + (block.depth === 1 ? 34 : 20) }
    }

    case 'paragraph': {
      const lines = layoutSpans(block.spans, 'body', maxWidth, theme)
      const rows = createTextRows(lines, x, startY + 22, theme, 'body')
      const endY = rows.length === 0 ? startY + 22 : rows[rows.length - 1]!.y + rows[rows.length - 1]!.height
      return { rows, nextY: endY + 18 }
    }

    case 'blockquote': {
      const inset = 44
      const lines = layoutSpans(block.spans, 'quote', maxWidth - inset, theme)
      const rows = createTextRows(lines, x + inset, startY + 28, theme, 'quote', undefined, 'quote')
      const endY = rows.length === 0 ? startY + 28 : rows[rows.length - 1]!.y + rows[rows.length - 1]!.height
      return { rows, nextY: endY + 24 }
    }

    case 'list': {
      const rows: RenderRow[] = []
      let y = startY + 20
      for (let itemIndex = 0; itemIndex < block.items.length; itemIndex++) {
        const item = block.items[itemIndex]!
        const prefixText = block.ordered ? `${itemIndex + 1}.` : '•'
        const prefixWidth = measureSingleLine(prefixText, theme.styles['list-prefix'].font)
        const indent = prefixWidth + 20
        const lines = layoutSpans(item, 'body', maxWidth - indent, theme)
        const itemRows = createTextRows(
          lines,
          x + indent,
          y,
          theme,
          'body',
          { text: prefixText, width: prefixWidth, styleName: 'list-prefix' },
        )
        rows.push(...itemRows)
        y = itemRows.length === 0 ? y + 10 : itemRows[itemRows.length - 1]!.y + itemRows[itemRows.length - 1]!.height + 10
      }
      return { rows, nextY: y + 10 }
    }

    case 'code': {
      const lines = block.code.length === 0 ? [''] : block.code.split('\n')
      const rows: RenderRow[] = []
      let y = startY + 24
      for (let index = 0; index < lines.length; index++) {
        const prepared = layoutSpans([{ text: lines[index]!, style: 'code' }], 'code', maxWidth - 40, theme)
        const textRows = createTextRows(prepared, x + 20, y, theme, 'code', undefined, 'code')
        if (textRows.length === 0) {
          rows.push({ kind: 'text', x: x + 20, y, height: theme.styles['code'].lineHeight, fragments: [], tone: 'code' })
          y += theme.styles['code'].lineHeight
        } else {
          rows.push(...textRows)
          y = textRows[textRows.length - 1]!.y + textRows[textRows.length - 1]!.height
        }
      }
      return { rows, nextY: y + 18 }
    }

    case 'divider':
      return { rows: [{ kind: 'divider', y: startY + 24, height: 32 }], nextY: startY + 62 }

    case 'image':
      return {
        rows: [{ kind: 'image', y: startY + 24, height: 280, alt: block.alt, url: block.url }],
        nextY: startY + 324,
      }
  }
}

function createTextRows(
  lines: PreparedLine[],
  x: number,
  startY: number,
  theme: Theme,
  baseStyleName: InlineStyleName,
  prefix?: { text: string, width: number, styleName: InlineStyleName },
  tone?: 'quote' | 'code',
): TextRow[] {
  const rows: TextRow[] = []
  for (let index = 0; index < lines.length; index++) {
    const fragments = lines[index]!.fragments
    const lineHeight = fragments.length === 0
      ? theme.styles[baseStyleName].lineHeight
      : theme.styles[fragments[0]!.styleName].lineHeight
    rows.push({
      kind: 'text',
      x,
      y: startY + index * lineHeight,
      height: lineHeight,
      prefix: index === 0 ? prefix : undefined,
      fragments,
      tone,
    })
  }
  return rows
}

function layoutSpans(
  spans: InlineSpan[],
  baseStyleName: InlineStyleName,
  maxWidth: number,
  theme: Theme,
): PreparedLine[] {
  const items = createInlineItems(spans, baseStyleName, theme)
  const lines: PreparedLine[] = []
  if (items.length === 0) return lines

  let itemIndex = 0
  let cursor: LayoutCursor | null = null
  const safeWidth = Math.max(1, maxWidth)

  while (itemIndex < items.length) {
    const fragments: PreparedLineFragment[] = []
    let lineWidth = 0
    let remainingWidth = safeWidth

    lineLoop:
    while (itemIndex < items.length) {
      const item = items[itemIndex]!
      if (cursor !== null && cursorsMatch(cursor, item.endCursor)) {
        itemIndex++
        cursor = null
        continue
      }

      const leadingGap = fragments.length === 0 ? 0 : item.leadingGap
      const reservedWidth = leadingGap + item.chromeWidth
      if (fragments.length > 0 && reservedWidth >= remainingWidth) break lineLoop

      if (cursor === null) {
        const fullWidth = leadingGap + item.fullWidth + item.chromeWidth
        if (fullWidth <= remainingWidth) {
          fragments.push({
            styleName: item.styleName,
            text: item.fullText,
            width: item.fullWidth,
            leadingGap,
          })
          lineWidth += fullWidth
          remainingWidth = Math.max(0, safeWidth - lineWidth)
          itemIndex++
          continue
        }
      }

      const startCursor = cursor ?? { segmentIndex: 0, graphemeIndex: 0 }
      const line = layoutNextLine(item.prepared, startCursor, Math.max(1, remainingWidth - reservedWidth))
      if (line === null || cursorsMatch(startCursor, line.end)) {
        itemIndex++
        cursor = null
        continue
      }

      fragments.push({
        styleName: item.styleName,
        text: line.text,
        width: line.width,
        leadingGap,
      })
      lineWidth += leadingGap + line.width + item.chromeWidth
      remainingWidth = Math.max(0, safeWidth - lineWidth)

      if (cursorsMatch(line.end, item.endCursor)) {
        itemIndex++
        cursor = null
      } else {
        cursor = line.end
      }
      break lineLoop
    }

    if (fragments.length === 0) break
    lines.push({ fragments })
  }

  return lines
}

function createInlineItems(spans: InlineSpan[], baseStyleName: InlineStyleName, theme: Theme): TextInlineItem[] {
  const items: TextInlineItem[] = []
  let pendingGap = 0

  for (let index = 0; index < spans.length; index++) {
    const span = spans[index]!
    const styleName = resolveStyleName(baseStyleName, span.style)
    const style = theme.styles[styleName]
    const gapWidth = measureCollapsedSpaceWidth(style.font)
    const hasLeadingWhitespace = /^\s/.test(span.text)
    const hasTrailingWhitespace = /\s$/.test(span.text)
    const trimmedText = span.text.trim()
    const leadingGap = items.length === 0 ? 0 : hasLeadingWhitespace || pendingGap > 0 ? gapWidth : 0
    pendingGap = hasTrailingWhitespace ? gapWidth : 0
    if (trimmedText.length === 0) continue

    const prepared = getPrepared(trimmedText, style.font)
    const fullLine = layoutNextLine(prepared, { segmentIndex: 0, graphemeIndex: 0 }, 100_000)
    if (fullLine === null) continue

    items.push({
      styleName,
      prepared,
      endCursor: fullLine.end,
      fullText: fullLine.text,
      fullWidth: fullLine.width,
      leadingGap,
      chromeWidth: style.inlinePaddingX * 2,
    })
  }

  return items
}

function resolveStyleName(base: InlineStyleName, inline: InlineSpan['style']): InlineStyleName {
  switch (inline) {
    case 'strong':
      return base === 'quote' ? 'quote' : 'strong'
    case 'em':
      return base === 'quote' ? 'quote' : 'em'
    case 'code':
      return 'code'
    case 'link':
      return 'link'
    default:
      return base
  }
}

function paginateRows(rows: RenderRow[], preset: Preset): PageLayout[] {
  const pageHeight = preset.pageHeight
  if (pageHeight === null) return []

  const pages: PageLayout[] = []
  let currentRows: RenderRow[] = []
  let pageStartY = preset.topInset

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index]!
    const prospectiveBottom = row.y - pageStartY + row.height + preset.topInset
    if (prospectiveBottom > pageHeight - preset.bottomInset && currentRows.length > 0) {
      pages.push({ rows: shiftRows(currentRows, pageStartY - preset.topInset), height: pageHeight })
      currentRows = []
      pageStartY = row.y
    }
    currentRows.push(row)
  }

  if (currentRows.length > 0) {
    pages.push({ rows: shiftRows(currentRows, pageStartY - preset.topInset), height: pageHeight })
  }

  if (pages.length === 0) pages.push({ rows: [], height: pageHeight })
  return pages
}

function shiftRows(rows: RenderRow[], delta: number): RenderRow[] {
  return rows.map(row => {
    const cloned = cloneRow(row)
    cloned.y -= delta
    return cloned
  })
}

function computeDocumentHeight(rows: RenderRow[]): number {
  let max = 0
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index]!
    max = Math.max(max, row.y + row.height)
  }
  return max
}

function cloneRow(row: RenderRow): RenderRow {
  switch (row.kind) {
    case 'divider':
      return { kind: 'divider', y: row.y, height: row.height }
    case 'image':
      return { kind: 'image', y: row.y, height: row.height, alt: row.alt, url: row.url }
    case 'text':
      return {
        kind: 'text',
        x: row.x,
        y: row.y,
        height: row.height,
        prefix: row.prefix === undefined ? undefined : { ...row.prefix },
        fragments: row.fragments.map(fragment => ({ ...fragment })),
        tone: row.tone,
      }
  }
}

function getPrepared(text: string, font: string): PreparedTextWithSegments {
  const key = `${font}\n${text}`
  const cached = preparedCache.get(key)
  if (cached !== undefined) return cached
  const prepared = prepareWithSegments(text, font)
  preparedCache.set(key, prepared)
  return prepared
}

function measureSingleLine(text: string, font: string): number {
  const prepared = getPrepared(text, font)
  const line = layoutNextLine(prepared, { segmentIndex: 0, graphemeIndex: 0 }, 100_000)
  return line?.width ?? 0
}

function cursorsMatch(a: LayoutCursor, b: LayoutCursor): boolean {
  return a.segmentIndex === b.segmentIndex && a.graphemeIndex === b.graphemeIndex
}

function createTheme(input: Omit<Theme, 'styles'>): Theme {
  const bodyFontFamily = '"Source Han Serif SC", "Noto Serif SC", "Songti SC", Georgia, serif'
  const sansFamily = '"PingFang SC", "Hiragino Sans GB", "Segoe UI", sans-serif'
  const monoFamily = '"Cascadia Code", "Consolas", "SFMono-Regular", ui-monospace, monospace'
  const baseBodyFont = `400 32px ${bodyFontFamily}`
  return {
    ...input,
    styles: {
      body: style(baseBodyFont, input.ink, 52),
      strong: style(`700 32px ${bodyFontFamily}`, input.ink, 52),
      em: style(`400 italic 32px ${bodyFontFamily}`, input.ink, 52),
      code: { ...style(`600 24px ${monoFamily}`, input.ink, 42), inlinePaddingX: 14, inlineBackground: input.accentFaint },
      link: { ...style(`600 32px ${sansFamily}`, input.accent, 52), underline: true },
      h1: style(`700 68px ${bodyFontFamily}`, input.ink, 84),
      h2: style(`700 48px ${sansFamily}`, input.ink, 62),
      h3: style(`700 38px ${sansFamily}`, input.ink, 50),
      quote: style(`500 31px ${bodyFontFamily}`, input.ink, 50),
      caption: style(`500 22px ${sansFamily}`, input.muted, 34),
      'list-prefix': style(`700 32px ${sansFamily}`, input.accent, 52),
    },
  }
}

function style(font: string, color: string, lineHeight: number): TextStyle {
  return {
    font,
    color,
    lineHeight,
    gapWidth: 0,
    inlinePaddingX: 0,
  }
}

function measureCollapsedSpaceWidth(font: string): number {
  const cached = collapsedSpaceWidthCache.get(font)
  if (cached !== undefined) return cached
  const joined = measureSingleLine('A A', font)
  const compact = measureSingleLine('AA', font)
  const width = Math.max(0, joined - compact)
  collapsedSpaceWidthCache.set(font, width)
  return width
}

function parseMarkdown(source: string): MarkdownBlock[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const blocks: MarkdownBlock[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]!
    const trimmed = line.trim()
    if (trimmed.length === 0) {
      index++
      continue
    }

    if (trimmed.startsWith('```')) {
      index++
      const codeLines: string[] = []
      while (index < lines.length && !lines[index]!.trim().startsWith('```')) {
        codeLines.push(lines[index]!)
        index++
      }
      if (index < lines.length) index++
      blocks.push({ kind: 'code', code: codeLines.join('\n') })
      continue
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch !== null) {
      blocks.push({
        kind: 'heading',
        depth: headingMatch[1]!.length as 1 | 2 | 3,
        spans: parseInline(headingMatch[2]!),
      })
      index++
      continue
    }

    if (/^([-*_])(?:\s*\1){2,}\s*$/.test(trimmed)) {
      blocks.push({ kind: 'divider' })
      index++
      continue
    }

    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imageMatch !== null) {
      blocks.push({ kind: 'image', alt: imageMatch[1]!, url: imageMatch[2]!.trim() })
      index++
      continue
    }

    if (/^>\s?/.test(trimmed)) {
      const quoteLines: string[] = []
      while (index < lines.length && /^>\s?/.test(lines[index]!.trim())) {
        quoteLines.push(lines[index]!.trim().replace(/^>\s?/, ''))
        index++
      }
      blocks.push({ kind: 'blockquote', spans: parseInline(quoteLines.join(' ')) })
      continue
    }

    if (/^\s*((?:[-*+])|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line)
      const items: InlineSpan[][] = []
      while (index < lines.length && /^\s*((?:[-*+])|\d+\.)\s+/.test(lines[index]!)) {
        const itemMatch = lines[index]!.match(/^\s*((?:[-*+])|\d+\.)\s+(.+)$/)
        items.push(parseInline(itemMatch?.[2] ?? ''))
        index++
      }
      blocks.push({ kind: 'list', ordered, items })
      continue
    }

    const paragraphLines = [trimmed]
    index++
    while (index < lines.length) {
      const current = lines[index]!
      const currentTrimmed = current.trim()
      if (
        currentTrimmed.length === 0 ||
        /^```/.test(currentTrimmed) ||
        /^(#{1,3})\s+/.test(currentTrimmed) ||
        /^>\s?/.test(currentTrimmed) ||
        /^([-*_])(?:\s*\1){2,}\s*$/.test(currentTrimmed) ||
        /^\s*((?:[-*+])|\d+\.)\s+/.test(current) ||
        /^!\[/.test(currentTrimmed)
      ) {
        if (currentTrimmed.length === 0) index++
        break
      }
      paragraphLines.push(currentTrimmed)
      index++
    }
    blocks.push({ kind: 'paragraph', spans: parseInline(paragraphLines.join(' ')) })
  }

  return blocks
}

function parseInline(text: string): InlineSpan[] {
  const spans: InlineSpan[] = []
  let cursor = 0

  while (cursor < text.length) {
    if (text.startsWith('**', cursor)) {
      const end = text.indexOf('**', cursor + 2)
      if (end !== -1) {
        spans.push({ text: text.slice(cursor + 2, end), style: 'strong' })
        cursor = end + 2
        continue
      }
    }

    if (text[cursor] === '*') {
      const end = text.indexOf('*', cursor + 1)
      if (end !== -1) {
        spans.push({ text: text.slice(cursor + 1, end), style: 'em' })
        cursor = end + 1
        continue
      }
    }

    if (text[cursor] === '`') {
      const end = text.indexOf('`', cursor + 1)
      if (end !== -1) {
        spans.push({ text: text.slice(cursor + 1, end), style: 'code' })
        cursor = end + 1
        continue
      }
    }

    if (text[cursor] === '[') {
      const middle = text.indexOf('](', cursor + 1)
      const close = middle === -1 ? -1 : text.indexOf(')', middle + 2)
      if (middle !== -1 && close !== -1) {
        spans.push({ text: text.slice(cursor + 1, middle), style: 'link' })
        cursor = close + 1
        continue
      }
    }

    const next = findNextInlineBoundary(text, cursor + 1)
    spans.push({ text: text.slice(cursor, next), style: 'body' })
    cursor = next
  }

  return mergeSpans(spans)
}

function findNextInlineBoundary(text: string, from: number): number {
  let next = text.length
  const markers = ['**', '*', '`', '[']
  for (let index = 0; index < markers.length; index++) {
    const found = text.indexOf(markers[index]!, from)
    if (found !== -1) next = Math.min(next, found)
  }
  return next
}

function mergeSpans(spans: InlineSpan[]): InlineSpan[] {
  const merged: InlineSpan[] = []
  for (let index = 0; index < spans.length; index++) {
    const span = spans[index]!
    if (span.text.length === 0) continue
    const previous = merged[merged.length - 1]
    if (previous !== undefined && previous.style === span.style) {
      previous.text += span.text
    } else {
      merged.push({ ...span })
    }
  }
  return merged
}
