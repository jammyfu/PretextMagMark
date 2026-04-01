import { layoutStyledSpans, measureSingleLine } from '../adapters/pretext'
import type {
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

export function buildRenderDocument(source: string, presetKey: PresetKey, themeKey: ThemeKey): RenderDocument {
  const preset = getPreset(presetKey)
  const theme = getTheme(themeKey)
  const blocks = parseMarkdown(source)
  const rows = layoutBlocks(blocks, preset, theme)
  const pages = preset.pageHeight === null
    ? [{
        rows: rows.filter(row => row.kind !== 'page-break').map(cloneRow),
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
      const styleName = block.depth === 1 ? 'h1' : block.depth === 2 ? 'h2' : 'h3'
      const gapBefore = context.previous === null ? 0 : theme.rhythm.sectionGap + (block.depth === 1 ? 6 : 0)
      const lines = layoutStyledSpans(block.spans, styleName, maxWidth, theme)
      const rows = createTextRows(lines, x, startY + gapBefore, theme, styleName)
      const endY = rows.length === 0 ? startY + gapBefore : rows[rows.length - 1]!.y + rows[rows.length - 1]!.height
      return { rows, nextY: endY + (block.depth === 1 ? 20 : theme.rhythm.compactGap) }
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
      return {
        rows: [{ kind: 'image', y: startY + 18, height: 280, alt: block.alt, url: block.url, caption: block.caption }],
        nextY: startY + 336,
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

function paginateRows(rows: RenderRow[], preset: Preset): PageLayout[] {
  const pageHeight = preset.pageHeight
  if (pageHeight === null) return []

  const pages: PageLayout[] = []
  let currentRows: RenderRow[] = []
  let pageStartY = preset.topInset

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index]!

    if (row.kind === 'page-break') {
      if (currentRows.length > 0) {
        pages.push({ rows: shiftRows(currentRows, pageStartY - preset.topInset), height: pageHeight })
      } else {
        pages.push({ rows: [], height: pageHeight })
      }
      currentRows = []
      pageStartY = row.y
      continue
    }

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
    if (cloned.kind !== 'page-break') {
      cloned.y -= delta
    }
    return cloned
  })
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
      return { kind: 'image', y: row.y, height: row.height, alt: row.alt, url: row.url, caption: row.caption }
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
