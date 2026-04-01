import { layoutStyledSpans, measureSingleLine } from '../adapters/pretext'
import type {
  CoverTemplateKey,
  InlineSpan,
  InlineStyleName,
  MarkdownBlock,
  PageLayout,
  Preset,
  PresetKey,
  PreparedLine,
  RenderDocument,
  RenderRow,
  TextRow,
  Theme,
  ThemeKey,
} from '../domain/types'
import { parseMarkdown } from '../markdown/parser'
import { getPreset, getTheme } from '../themes/catalog'

type BlockContext = {
  previous: MarkdownBlock | null
}

export function buildRenderDocument(source: string, presetKey: PresetKey, themeKey: ThemeKey, coverTemplate: CoverTemplateKey): RenderDocument {
  const preset = getPreset(presetKey)
  const theme = getTheme(themeKey)
  const blocks = parseMarkdown(source)
  const contentPages = preset.pageHeight === null
    ? buildLongImagePages(blocks, preset, theme)
    : composePagedLayout(blocks, preset, theme)
  const pages = preset.pageHeight === null ? contentPages : prependCoverPage(blocks, preset, contentPages, coverTemplate)

  return {
    preset,
    theme,
    pages,
    blockCount: blocks.length,
    sourceLength: source.length,
  }
}

function buildLongImagePages(blocks: MarkdownBlock[], preset: Preset, theme: Theme): PageLayout[] {
  const rows = layoutBlocks(blocks, preset, theme)
  return [{
    kind: 'content',
    rows: rows.filter(row => row.kind !== 'page-break').map(cloneRow),
    height: Math.max(rows.length === 0 ? 960 : computeDocumentHeight(rows) + preset.bottomInset, 960),
  }]
}

function prependCoverPage(blocks: MarkdownBlock[], preset: Preset, pages: PageLayout[], coverTemplate: CoverTemplateKey): PageLayout[] {
  const cover = extractCoverData(blocks, coverTemplate)
  if (cover === null) return pages
  return [{
    kind: 'cover',
    rows: [],
    height: preset.pageHeight ?? 1440,
    cover,
  }, ...pages]
}

function extractCoverData(blocks: MarkdownBlock[], coverTemplate: CoverTemplateKey): PageLayout['cover'] | null {
  const title = blocks.find((block): block is Extract<MarkdownBlock, { kind: 'heading' }> => block.kind === 'heading' && block.depth === 1)
  if (title === undefined) return null
  const dek = blocks.find((block): block is Extract<MarkdownBlock, { kind: 'paragraph' }> => block.kind === 'paragraph')
  const kicker = blocks.find((block): block is Extract<MarkdownBlock, { kind: 'heading' }> => block.kind === 'heading' && block.depth === 4)
  const image = blocks.find((block): block is Extract<MarkdownBlock, { kind: 'image' }> => block.kind === 'image')
  return {
    template: coverTemplate,
    title: flattenSpans(title.spans),
    dek: dek === undefined ? undefined : flattenSpans(dek.spans),
    kicker: kicker === undefined ? undefined : flattenSpans(kicker.spans),
    imageUrl: image?.url,
  }
}

function layoutBlocks(blocks: MarkdownBlock[], preset: Preset, theme: Theme): RenderRow[] {
  const rows: RenderRow[] = []
  let y = preset.topInset
  let previous: MarkdownBlock | null = null

  for (let index = 0; index < blocks.length; index++) {
    const block = blocks[index]!
    const result = layoutBlock(block, preset.marginX, preset.contentWidth, y, theme, { previous })
    rows.push(...result.rows)
    y = result.nextY
    previous = block.kind === 'page-break' ? previous : block
  }
  return rows
}

function layoutBlock(
  block: MarkdownBlock,
  x: number,
  maxWidth: number,
  startY: number,
  theme: Theme,
  context: BlockContext,
): { rows: RenderRow[], nextY: number } {
  switch (block.kind) {
    case 'heading': {
      const styleName = block.depth === 1 ? 'h1' : block.depth === 2 ? 'h2' : block.depth === 3 ? 'h3' : 'eyebrow'
      const gapBefore = context.previous === null ? 0 : theme.rhythm.sectionGap + (block.depth === 1 ? 6 : block.depth === 4 ? -4 : 0)
      const lines = layoutStyledSpans(block.spans, styleName, maxWidth, theme)
      const rows = createTextRows(lines, x, startY + gapBefore, theme, styleName)
      const endY = rows.length === 0 ? startY + gapBefore : rows[rows.length - 1]!.y + rows[rows.length - 1]!.height
      return { rows, nextY: endY + (block.depth === 1 ? 20 : block.depth === 4 ? 8 : theme.rhythm.compactGap) }
    }

    case 'paragraph': {
      const isLead = context.previous === null || context.previous.kind === 'heading' || context.previous.kind === 'divider' || context.previous.kind === 'page-break'
      const styleName: InlineStyleName = isLead ? 'lead' : 'body'
      const lines = layoutStyledSpans(block.spans, styleName, maxWidth, theme)
      const firstLineIndent = isLead ? theme.rhythm.leadIndent : theme.rhythm.paragraphIndent
      const rows = createTextRows(lines, x, startY, theme, styleName, undefined, undefined, firstLineIndent)
      const endY = rows.length === 0 ? startY : rows[rows.length - 1]!.y + rows[rows.length - 1]!.height
      return { rows, nextY: endY + (isLead ? theme.rhythm.sectionGap : theme.rhythm.compactGap) }
    }

    case 'blockquote': {
      const inset = 54
      const lines = layoutStyledSpans(block.spans, 'quote', maxWidth - inset - 20, theme)
      const rows = createTextRows(lines, x + inset, startY + 20, theme, 'quote', undefined, 'quote')
      const endY = rows.length === 0 ? startY + 20 : rows[rows.length - 1]!.y + rows[rows.length - 1]!.height
      return { rows, nextY: endY + theme.rhythm.sectionGap }
    }

    case 'pull-quote': {
      const inset = 92
      const lines = layoutStyledSpans(block.spans, 'quote', maxWidth - inset * 2 + 28, theme)
      const rows = createTextRows(lines, x + inset, startY + 28, theme, 'quote', undefined, 'pull-quote')
      const endY = rows.length === 0 ? startY + 28 : rows[rows.length - 1]!.y + rows[rows.length - 1]!.height
      return { rows, nextY: endY + theme.rhythm.sectionGap }
    }

    case 'list': {
      const rows: RenderRow[] = []
      let y = startY + 8
      for (let itemIndex = 0; itemIndex < block.items.length; itemIndex++) {
        const item = block.items[itemIndex]!
        const prefixText = block.ordered ? `${itemIndex + 1}.` : '-'
        const prefixWidth = measureSingleLine(prefixText, theme.styles['list-prefix'].font)
        const indent = prefixWidth + 24
        const lines = layoutStyledSpans(item, 'body', maxWidth - indent, theme)
        const itemRows = createTextRows(
          lines,
          x + indent,
          y,
          theme,
          'body',
          { text: prefixText, width: prefixWidth, styleName: 'list-prefix' },
        )
        rows.push(...itemRows)
        y = itemRows.length === 0 ? y + theme.rhythm.compactGap : itemRows[itemRows.length - 1]!.y + itemRows[itemRows.length - 1]!.height + 8
      }
      return { rows, nextY: y + theme.rhythm.compactGap }
    }

    case 'code': {
      const lines = block.code.length === 0 ? [''] : block.code.split('\n')
      const rows: RenderRow[] = []
      let y = startY + 16
      for (let index = 0; index < lines.length; index++) {
        const prepared = layoutStyledSpans([{ text: lines[index]!, style: 'code' }], 'code', maxWidth - 40, theme)
        const textRows = createTextRows(prepared, x + 20, y, theme, 'code', undefined, 'code')
        if (textRows.length === 0) {
          rows.push({ kind: 'text', x: x + 20, y, height: theme.styles.code.lineHeight, fragments: [], tone: 'code' })
          y += theme.styles.code.lineHeight
        } else {
          rows.push(...textRows)
          y = textRows[textRows.length - 1]!.y + textRows[textRows.length - 1]!.height
        }
      }
      return { rows, nextY: y + theme.rhythm.sectionGap }
    }

    case 'divider':
      return { rows: [{ kind: 'divider', y: startY + 16, height: 28 }], nextY: startY + 54 }

    case 'page-break':
      return { rows: [{ kind: 'page-break', y: startY, height: 0 }], nextY: startY }

    case 'image':
      {
        const mediaHeight = resolveImageHeight(maxWidth, block.ratio)
        const cardHeight = mediaHeight + 126
      return {
        rows: [{
          kind: 'image',
          y: startY + 18,
          height: cardHeight,
          mediaHeight,
          alt: block.alt,
          url: block.url,
          caption: block.caption,
          ratio: block.ratio,
          fit: block.fit,
        }],
        nextY: startY + cardHeight + 74,
      }
      }
  }
}

function composePagedLayout(blocks: MarkdownBlock[], preset: Preset, theme: Theme): PageLayout[] {
  const pageHeight = preset.pageHeight
  if (pageHeight === null) return []

  const pages: PageLayout[] = []
  let currentRows: RenderRow[] = []
  let previous: MarkdownBlock | null = null
  let currentColumn = 0
  let columnTop = preset.topInset
  let columnBottoms = createColumnBottoms(preset, preset.topInset)

  for (let index = 0; index < blocks.length; index++) {
    const block = blocks[index]!

    if (block.kind === 'page-break') {
      pushPage(pages, currentRows, pageHeight)
      currentRows = []
      currentColumn = 0
      columnTop = preset.topInset
      columnBottoms = createColumnBottoms(preset, preset.topInset)
      continue
    }

    const placement = getBlockPlacement(block, previous)

    if (placement === 'full-width') {
      while (true) {
        const startY = Math.max(...columnBottoms)
        if (
          currentRows.length > 0 &&
          shouldAdvanceBeforePlacement(blocks, index, block, previous, preset, theme, placement, preset.marginX, preset.contentWidth, startY)
        ) {
          pushPage(pages, currentRows, pageHeight)
          currentRows = []
          currentColumn = 0
          columnTop = preset.topInset
          columnBottoms = createColumnBottoms(preset, preset.topInset)
          continue
        }
        const placed = layoutBlock(block, preset.marginX, preset.contentWidth, startY, theme, { previous })
        if (fitsOnPage(placed.nextY, preset) || currentRows.length === 0) {
          currentRows.push(...placed.rows)
          columnTop = placed.nextY
          columnBottoms = createColumnBottoms(preset, columnTop)
          currentColumn = 0
          break
        }

        pushPage(pages, currentRows, pageHeight)
        currentRows = []
        currentColumn = 0
        columnTop = preset.topInset
        columnBottoms = createColumnBottoms(preset, preset.topInset)
      }
    } else {
      const columnWidth = getColumnWidth(preset)
      while (true) {
        const x = getColumnX(preset, currentColumn)
        const startY = Math.max(columnTop, columnBottoms[currentColumn]!)
        if (
          currentRows.length > 0 &&
          shouldAdvanceBeforePlacement(blocks, index, block, previous, preset, theme, placement, x, columnWidth, startY)
        ) {
          if (currentColumn < preset.columnCount - 1) {
            currentColumn++
            columnBottoms[currentColumn] = Math.max(columnBottoms[currentColumn]!, columnTop)
            continue
          }

          pushPage(pages, currentRows, pageHeight)
          currentRows = []
          currentColumn = 0
          columnTop = preset.topInset
          columnBottoms = createColumnBottoms(preset, preset.topInset)
          continue
        }
        const placed = layoutBlock(block, x, columnWidth, startY, theme, { previous })
        if (fitsOnPage(placed.nextY, preset) || currentRows.length === 0) {
          currentRows.push(...placed.rows)
          columnBottoms[currentColumn] = placed.nextY
          break
        }

        if (block.kind === 'paragraph') {
          const split = splitParagraphRows(placed.rows, pageHeight - preset.bottomInset)
          if (split !== null) {
            currentRows.push(...split.head)
            columnBottoms[currentColumn] = getRowsBottom(split.head)

            if (currentColumn < preset.columnCount - 1) {
              currentColumn++
              columnBottoms[currentColumn] = Math.max(columnBottoms[currentColumn]!, columnTop)
            } else {
              pushPage(pages, currentRows, pageHeight)
              currentRows = []
              currentColumn = 0
              columnTop = preset.topInset
              columnBottoms = createColumnBottoms(preset, preset.topInset)
            }

            const continuationX = getColumnX(preset, currentColumn)
            const continuationY = Math.max(columnTop, columnBottoms[currentColumn]!)
            const continuationRows = rebaseTextRows(split.tail, continuationX, continuationY)
            currentRows.push(...continuationRows)
            columnBottoms[currentColumn] = getRowsBottom(continuationRows)
            break
          }
        }

        if (currentColumn < preset.columnCount - 1) {
          currentColumn++
          columnBottoms[currentColumn] = Math.max(columnBottoms[currentColumn]!, columnTop)
          continue
        }

        pushPage(pages, currentRows, pageHeight)
        currentRows = []
        currentColumn = 0
        columnTop = preset.topInset
        columnBottoms = createColumnBottoms(preset, preset.topInset)
      }
    }

    previous = block
  }

  if (currentRows.length > 0 || pages.length === 0) {
    pushPage(pages, currentRows, pageHeight)
  }

  return pages
}

function shouldAdvanceBeforePlacement(
  blocks: MarkdownBlock[],
  index: number,
  block: MarkdownBlock,
  previous: MarkdownBlock | null,
  preset: Preset,
  theme: Theme,
  placement: 'full-width' | 'column',
  x: number,
  width: number,
  startY: number,
): boolean {
  if (!isKeepWithNextBlock(block)) return false

  const current = layoutBlock(block, x, width, startY, theme, { previous })
  if (!fitsOnPage(current.nextY, preset)) return false

  const nextBlock = findNextContentBlock(blocks, index + 1)
  if (nextBlock === null) return false

  const nextPlacement = getBlockPlacement(nextBlock, block)
  const nextX = nextPlacement === 'full-width' ? preset.marginX : x
  const nextWidth = nextPlacement === 'full-width' ? preset.contentWidth : width
  const next = layoutBlock(nextBlock, nextX, nextWidth, current.nextY, theme, { previous: block })

  return !fitsOnPage(next.nextY, preset)
}

function isKeepWithNextBlock(block: MarkdownBlock): boolean {
  return block.kind === 'heading' || block.kind === 'divider'
}

function findNextContentBlock(blocks: MarkdownBlock[], fromIndex: number): MarkdownBlock | null {
  for (let index = fromIndex; index < blocks.length; index++) {
    const block = blocks[index]!
    if (block.kind !== 'page-break') return block
  }
  return null
}

function getBlockPlacement(block: MarkdownBlock, previous: MarkdownBlock | null): 'full-width' | 'column' {
  switch (block.kind) {
    case 'heading':
      return block.depth <= 2 ? 'full-width' : 'column'
    case 'paragraph':
      if (previous === null || previous.kind === 'heading' || previous.kind === 'divider') return 'full-width'
      return 'column'
    case 'list':
      return 'column'
    case 'blockquote':
    case 'pull-quote':
    case 'code':
    case 'divider':
    case 'image':
      return 'full-width'
    case 'page-break':
      return 'full-width'
  }
}

function createColumnBottoms(preset: Preset, initialY: number): number[] {
  return Array.from({ length: preset.columnCount }, () => initialY)
}

function getColumnWidth(preset: Preset): number {
  const totalGap = preset.columnGap * Math.max(0, preset.columnCount - 1)
  return (preset.contentWidth - totalGap) / preset.columnCount
}

function getColumnX(preset: Preset, columnIndex: number): number {
  return preset.marginX + columnIndex * (getColumnWidth(preset) + preset.columnGap)
}

function splitParagraphRows(rows: RenderRow[], bottom: number): { head: TextRow[], tail: TextRow[] } | null {
  if (rows.length === 0 || rows.some(row => row.kind !== 'text')) return null
  const textRows = rows as TextRow[]
  let fitCount = 0
  for (let index = 0; index < textRows.length; index++) {
    const row = textRows[index]!
    if (row.y + row.height <= bottom) fitCount++
  }

  const minLines = 2
  if (fitCount < minLines) return null
  if (textRows.length - fitCount < minLines) {
    fitCount = textRows.length - minLines
  }
  if (fitCount < minLines) return null

  return {
    head: textRows.slice(0, fitCount).map(cloneTextRow),
    tail: textRows.slice(fitCount).map(cloneTextRow),
  }
}

function rebaseTextRows(rows: TextRow[], x: number, y: number): TextRow[] {
  if (rows.length === 0) return []
  const originX = Math.min(...rows.map(row => row.x))
  const originY = rows[0]!.y
  return rows.map(row => ({
    ...cloneTextRow(row),
    x: row.x - originX + x,
    y: row.y - originY + y,
  }))
}

function fitsOnPage(nextY: number, preset: Preset): boolean {
  const pageHeight = preset.pageHeight
  return pageHeight === null || nextY <= pageHeight - preset.bottomInset
}

function pushPage(pages: PageLayout[], rows: RenderRow[], height: number): void {
  pages.push({
    kind: 'content',
    rows: rows.map(cloneRow),
    height,
  })
}

function getRowsBottom(rows: TextRow[]): number {
  return rows[rows.length - 1]!.y + rows[rows.length - 1]!.height
}

function createTextRows(
  lines: PreparedLine[],
  x: number,
  startY: number,
  theme: Theme,
  baseStyleName: InlineStyleName,
  prefix?: { text: string, width: number, styleName: InlineStyleName },
  tone?: 'quote' | 'code' | 'pull-quote',
  firstLineIndent = 0,
): TextRow[] {
  const rows: TextRow[] = []
  for (let index = 0; index < lines.length; index++) {
    const fragments = lines[index]!.fragments
    const lineHeight = fragments.length === 0
      ? theme.styles[baseStyleName].lineHeight
      : theme.styles[fragments[0]!.styleName].lineHeight
    const lineWidth = fragments.reduce((sum, fragment) => sum + fragment.leadingGap + fragment.width, 0)
    rows.push({
      kind: 'text',
      x: x + (index === 0 ? firstLineIndent : 0),
      y: startY + index * lineHeight,
      height: lineHeight,
      lineWidth,
      prefix: index === 0 ? prefix : undefined,
      fragments,
      tone,
    })
  }
  return rows
}

function computeDocumentHeight(rows: RenderRow[]): number {
  let max = 0
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index]!
    if (row.kind === 'page-break') continue
    max = Math.max(max, row.y + row.height)
  }
  return max
}

function cloneRow(row: RenderRow): RenderRow {
  switch (row.kind) {
    case 'divider':
      return { kind: 'divider', y: row.y, height: row.height }
    case 'page-break':
      return { kind: 'page-break', y: row.y, height: row.height }
    case 'image':
      return {
        kind: 'image',
        y: row.y,
        height: row.height,
        mediaHeight: row.mediaHeight,
        alt: row.alt,
        url: row.url,
        caption: row.caption,
        ratio: row.ratio,
        fit: row.fit,
      }
    case 'text':
      return {
        kind: 'text',
        x: row.x,
        y: row.y,
        height: row.height,
        lineWidth: row.lineWidth,
        prefix: row.prefix === undefined ? undefined : { ...row.prefix },
        fragments: row.fragments.map(fragment => ({ ...fragment })),
        tone: row.tone,
      }
  }
}

function cloneTextRow(row: TextRow): TextRow {
  return {
    kind: 'text',
    x: row.x,
    y: row.y,
    height: row.height,
    lineWidth: row.lineWidth,
    prefix: row.prefix === undefined ? undefined : { ...row.prefix },
    fragments: row.fragments.map(fragment => ({ ...fragment })),
    tone: row.tone,
  }
}

function resolveImageHeight(width: number, ratio: string | undefined): number {
  const parsed = parseRatio(ratio)
  if (parsed === null) return 320
  const height = width * (parsed.height / parsed.width)
  return Math.max(220, Math.min(560, Math.round(height)))
}

function parseRatio(ratio: string | undefined): { width: number, height: number } | null {
  if (ratio === undefined) return null
  const match = ratio.match(/^(\d+):(\d+)$/)
  if (match === null) return null
  const width = Number.parseInt(match[1]!, 10)
  const height = Number.parseInt(match[2]!, 10)
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null
  return { width, height }
}

function flattenSpans(spans: InlineSpan[]): string {
  return spans.map(span => span.text).join('').trim()
}
