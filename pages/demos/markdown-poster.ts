import { layoutNextLine, prepareWithSegments, type LayoutCursor, type PreparedTextWithSegments } from '../../src/layout.ts'

type PresetKey = 'xiaohongshu' | 'long-image'
type ThemeKey = 'berry' | 'ink'
type OrnamentKey = 'editorial' | 'minimal'
type InlineStyleName = 'body' | 'strong' | 'em' | 'code' | 'link' | 'h1' | 'h2' | 'h3' | 'quote' | 'caption' | 'list-prefix'

type MarkdownBlock =
  | { kind: 'heading'; depth: 1 | 2 | 3; spans: InlineSpan[] }
  | { kind: 'paragraph'; spans: InlineSpan[] }
  | { kind: 'blockquote'; spans: InlineSpan[] }
  | { kind: 'list'; ordered: boolean; items: InlineSpan[][] }
  | { kind: 'code'; language: string | null; code: string }
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
  inlinePaddingY: number
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
  shadow: string
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

type PageLayout = {
  rows: RenderRow[]
  height: number
}

type RenderDocument = {
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

type DomCache = {
  markdownInput: HTMLTextAreaElement
  fileInput: HTMLInputElement
  sampleButton: HTMLButtonElement
  documentName: HTMLInputElement
  presetSelect: HTMLSelectElement
  themeSelect: HTMLSelectElement
  scaleSelect: HTMLSelectElement
  ornamentSelect: HTMLSelectElement
  renderButton: HTMLButtonElement
  exportCurrentButton: HTMLButtonElement
  exportAllButton: HTMLButtonElement
  prevPageButton: HTMLButtonElement
  nextPageButton: HTMLButtonElement
  pageChip: HTMLSpanElement
  previewHeading: HTMLElement
  previewSubheading: HTMLElement
  previewMeta: HTMLElement
  previewCanvas: HTMLCanvasElement
  stats: HTMLElement
}

type State = {
  source: string
  fileStem: string
  presetKey: PresetKey
  themeKey: ThemeKey
  ornament: OrnamentKey
  scale: number
  currentPageIndex: number
  document: RenderDocument | null
}

const SAMPLE_MARKDOWN = `# 用 Pretext 做小红书图文排版

把同一份 Markdown 内容，一键排成小红书多页卡片，或者导出成长图。

## 这套 demo 现在能做什么

- 直接导入 \`.md\` 文件
- 自动分页为 1080×1440 的小红书卡片
- 自动拼成长图，适合文章封面和知识长图
- 以 2x / 3x / 4x 输出高分辨率 PNG

> 这里没有复刻 MagMark 全部编辑器，而是把当前仓库的 Pretext 行布局能力用在真实的 Markdown 出图链路里。重点是排版、分页和稳定导出。

## 适合的内容结构

1. 经验总结
2. 知识清单
3. 产品方案说明
4. 课程讲义节选

---

### 一个提醒

如果 Markdown 里包含图片语法：

\`\`\`md
![配图说明](./cover.png)
\`\`\`

当前 demo 会先把它渲染成占位块，帮助你确认版面节奏。后续如果你需要，我可以继续把本地图片真正画进导出 PNG。`

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
    shadow: 'rgba(86, 39, 22, 0.14)',
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
    shadow: 'rgba(31, 24, 18, 0.12)',
  }),
}

const st: State = {
  source: SAMPLE_MARKDOWN,
  fileStem: 'pretext-layout',
  presetKey: 'xiaohongshu',
  themeKey: 'berry',
  ornament: 'editorial',
  scale: 3,
  currentPageIndex: 0,
  document: null,
}

const dom = getDom()

dom.markdownInput.value = SAMPLE_MARKDOWN

wireEvents()

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true })
} else {
  boot()
}

function boot(): void {
  void document.fonts.ready.then(() => {
    renderFromState()
  })
}

function getDom(): DomCache {
  return {
    markdownInput: getRequiredElement('markdown-input', HTMLTextAreaElement),
    fileInput: getRequiredElement('markdown-file', HTMLInputElement),
    sampleButton: getRequiredElement('sample-button', HTMLButtonElement),
    documentName: getRequiredElement('document-name', HTMLInputElement),
    presetSelect: getRequiredElement('preset-select', HTMLSelectElement),
    themeSelect: getRequiredElement('theme-select', HTMLSelectElement),
    scaleSelect: getRequiredElement('scale-select', HTMLSelectElement),
    ornamentSelect: getRequiredElement('ornament-select', HTMLSelectElement),
    renderButton: getRequiredElement('render-button', HTMLButtonElement),
    exportCurrentButton: getRequiredElement('export-current-button', HTMLButtonElement),
    exportAllButton: getRequiredElement('export-all-button', HTMLButtonElement),
    prevPageButton: getRequiredElement('prev-page-button', HTMLButtonElement),
    nextPageButton: getRequiredElement('next-page-button', HTMLButtonElement),
    pageChip: getRequiredElement('page-chip', HTMLSpanElement),
    previewHeading: getRequiredElement('preview-heading', HTMLElement),
    previewSubheading: getRequiredElement('preview-subheading', HTMLElement),
    previewMeta: getRequiredElement('preview-meta', HTMLElement),
    previewCanvas: getRequiredElement('preview-canvas', HTMLCanvasElement),
    stats: getRequiredElement('stats', HTMLElement),
  }
}

function getRequiredElement<T extends Element>(id: string, ctor: { new (): T }): T {
  const element = document.getElementById(id)
  if (!(element instanceof ctor)) throw new Error(`#${id} not found`)
  return element
}

function wireEvents(): void {
  dom.renderButton.addEventListener('click', () => renderFromState())

  dom.sampleButton.addEventListener('click', () => {
    st.source = SAMPLE_MARKDOWN
    st.fileStem = 'pretext-layout'
    st.currentPageIndex = 0
    dom.markdownInput.value = SAMPLE_MARKDOWN
    dom.documentName.value = st.fileStem
    renderFromState()
  })

  dom.markdownInput.addEventListener('input', () => {
    st.source = dom.markdownInput.value
  })

  dom.documentName.addEventListener('input', () => {
    st.fileStem = sanitizeStem(dom.documentName.value)
  })

  dom.presetSelect.addEventListener('change', () => {
    st.presetKey = dom.presetSelect.value as PresetKey
    st.currentPageIndex = 0
    renderFromState()
  })

  dom.themeSelect.addEventListener('change', () => {
    st.themeKey = dom.themeSelect.value as ThemeKey
    renderFromState()
  })

  dom.ornamentSelect.addEventListener('change', () => {
    st.ornament = dom.ornamentSelect.value as OrnamentKey
    renderFromState()
  })

  dom.scaleSelect.addEventListener('change', () => {
    st.scale = Number.parseInt(dom.scaleSelect.value, 10)
  })

  dom.prevPageButton.addEventListener('click', () => {
    if (st.document === null) return
    st.currentPageIndex = Math.max(0, st.currentPageIndex - 1)
    paintPreview()
    syncUi()
  })

  dom.nextPageButton.addEventListener('click', () => {
    if (st.document === null) return
    st.currentPageIndex = Math.min(st.document.pages.length - 1, st.currentPageIndex + 1)
    paintPreview()
    syncUi()
  })

  dom.exportCurrentButton.addEventListener('click', () => {
    void exportCurrentPage()
  })

  dom.exportAllButton.addEventListener('click', () => {
    void exportAllPages()
  })

  dom.fileInput.addEventListener('change', () => {
    const file = dom.fileInput.files?.[0]
    if (file === undefined) return
    void file.text().then(text => {
      st.source = text
      st.fileStem = sanitizeStem(file.name.replace(/\.[^.]+$/, ''))
      st.currentPageIndex = 0
      dom.markdownInput.value = text
      dom.documentName.value = st.fileStem
      renderFromState()
    })
  })
}

function renderFromState(): void {
  st.source = dom.markdownInput.value
  st.fileStem = sanitizeStem(dom.documentName.value)
  const preset = PRESETS[st.presetKey]
  const theme = THEMES[st.themeKey]
  const blocks = parseMarkdown(st.source)
  st.document = buildRenderDocument(blocks, preset, theme)
  st.currentPageIndex = Math.min(st.currentPageIndex, st.document.pages.length - 1)
  paintPreview()
  syncUi()
}

function syncUi(): void {
  const doc = st.document
  if (doc === null) return
  const page = doc.pages[st.currentPageIndex]
  if (page === undefined) return

  const pageCount = doc.pages.length
  dom.pageChip.textContent = `第 ${st.currentPageIndex + 1} / ${pageCount} 页`
  dom.prevPageButton.disabled = pageCount <= 1 || st.currentPageIndex === 0
  dom.nextPageButton.disabled = pageCount <= 1 || st.currentPageIndex === pageCount - 1
  dom.exportAllButton.disabled = st.presetKey === 'long-image'

  dom.previewHeading.textContent = doc.preset.label
  dom.previewSubheading.textContent = `${doc.theme.name} · ${doc.blockCount} 个内容块`
  dom.previewMeta.textContent = `${doc.preset.pageWidth} × ${Math.round(page.height)} · ${pageCount} 页`

  const summary = [
    `块数：${doc.blockCount}`,
    `字符数：${doc.sourceLength}`,
    `页数：${pageCount}`,
    `当前尺寸：${doc.preset.pageWidth} × ${Math.round(page.height)}`,
    st.presetKey === 'xiaohongshu' ? '模式：自动分页小红书卡片' : '模式：单张长图',
    `导出倍率：${st.scale}×`,
    '说明：Markdown 图片当前先渲染为占位块，便于先跑通版式与导出。',
  ]
  dom.stats.innerHTML = summary.map(item => `<div>${escapeHtml(item)}</div>`).join('')
}

function paintPreview(): void {
  const doc = st.document
  if (doc === null) return
  const page = doc.pages[st.currentPageIndex]
  if (page === undefined) return
  drawPageToCanvas(dom.previewCanvas, page, doc, 1)
}

async function exportCurrentPage(): Promise<void> {
  const doc = st.document
  if (doc === null) return
  const page = doc.pages[st.currentPageIndex]
  if (page === undefined) return
  const canvas = document.createElement('canvas')
  drawPageToCanvas(canvas, page, doc, st.scale)
  const blob = await canvasToBlob(canvas)
  downloadBlob(blob, `${st.fileStem}-${st.currentPageIndex + 1}.png`)
}

async function exportAllPages(): Promise<void> {
  const doc = st.document
  if (doc === null || st.presetKey !== 'xiaohongshu') return
  for (let index = 0; index < doc.pages.length; index++) {
    const page = doc.pages[index]!
    const canvas = document.createElement('canvas')
    drawPageToCanvas(canvas, page, doc, st.scale)
    const blob = await canvasToBlob(canvas)
    downloadBlob(blob, `${st.fileStem}-${index + 1}.png`)
    if (index < doc.pages.length - 1) await wait(120)
  }
}

function buildRenderDocument(blocks: MarkdownBlock[], preset: Preset, theme: Theme): RenderDocument {
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
    sourceLength: st.source.length,
  }
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
      const rows = createTextRows(lines, x, startY + gapBefore, styleName)
      const endY = rows.length === 0 ? startY + gapBefore : rows[rows.length - 1]!.y + rows[rows.length - 1]!.height
      return { rows, nextY: endY + (block.depth === 1 ? 34 : 20) }
    }

    case 'paragraph': {
      const lines = layoutSpans(block.spans, 'body', maxWidth, theme)
      const rows = createTextRows(lines, x, startY + 22, 'body')
      const endY = rows.length === 0 ? startY + 22 : rows[rows.length - 1]!.y + rows[rows.length - 1]!.height
      return { rows, nextY: endY + 18 }
    }

    case 'blockquote': {
      const inset = 44
      const lines = layoutSpans(block.spans, 'quote', maxWidth - inset, theme)
      const rows = createTextRows(lines, x + inset, startY + 28, 'quote', undefined, 'quote')
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
        const textRows = createTextRows(prepared, x + 20, y, 'code', undefined, 'code')
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
  baseStyleName: InlineStyleName,
  prefix?: { text: string, width: number, styleName: InlineStyleName },
  tone?: 'quote' | 'code',
): TextRow[] {
  const rows: TextRow[] = []
  for (let index = 0; index < lines.length; index++) {
    const fragments = lines[index]!.fragments
    const lineHeight = fragments.length === 0
      ? THEMES[st.themeKey].styles[baseStyleName].lineHeight
      : THEMES[st.themeKey].styles[fragments[0]!.styleName].lineHeight
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

function createTheme(input: {
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
  shadow: string
}): Theme {
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
      code: { ...style(`600 24px ${monoFamily}`, input.ink, 42), inlinePaddingX: 14, inlinePaddingY: 8, inlineBackground: input.accentFaint },
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
    inlinePaddingY: 0,
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

function drawPageToCanvas(canvas: HTMLCanvasElement, page: PageLayout, doc: RenderDocument, scale: number): void {
  const width = doc.preset.pageWidth
  const height = Math.max(1, Math.round(page.height))
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  canvas.style.aspectRatio = `${width} / ${height}`
  const ctx = canvas.getContext('2d')
  if (ctx === null) throw new Error('2D context not available')
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  drawPage(ctx, width, height, page, doc)
}

function drawPage(ctx: CanvasRenderingContext2D, width: number, height: number, page: PageLayout, doc: RenderDocument): void {
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

  if (st.ornament === 'editorial') {
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
  ctx.fillText('PRETEXT MARKDOWN', preset.marginX, 82)
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
  wrapCanvasText(ctx, row.url, preset.marginX + 32, row.y + 160, preset.contentWidth - 64, doc.theme.styles['caption'].lineHeight)
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

    const fenceMatch = trimmed.match(/^```([\w-]+)?$/)
    if (fenceMatch !== null) {
      const language = fenceMatch[1] ?? null
      index++
      const codeLines: string[] = []
      while (index < lines.length && !lines[index]!.trim().startsWith('```')) {
        codeLines.push(lines[index]!)
        index++
      }
      if (index < lines.length) index++
      blocks.push({ kind: 'code', language, code: codeLines.join('\n') })
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

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
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

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function sanitizeStem(name: string): string {
  const trimmed = name.trim()
  if (trimmed.length === 0) return 'pretext-layout'
  return trimmed.replace(/[<>:"/\\|?*\u0000-\u001F]+/g, '-')
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}
