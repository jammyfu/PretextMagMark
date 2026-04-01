import { layoutNextLine, prepareWithSegments } from '../../../src/layout.js'
import type {
  InlineSpan,
  InlineStyleName,
  LayoutCursor,
  PreparedLine,
  PreparedLineFragment,
  PreparedTextWithSegments,
  TextInlineItem,
  Theme,
} from '../domain/types'

const preparedCache = new Map<string, PreparedTextWithSegments>()
const collapsedSpaceWidthCache = new Map<string, number>()

export function layoutStyledSpans(
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

export function measureSingleLine(text: string, font: string): number {
  const prepared = getPrepared(text, font)
  const line = layoutNextLine(prepared, { segmentIndex: 0, graphemeIndex: 0 }, 100_000)
  return line?.width ?? 0
}

export function measureCollapsedSpaceWidth(font: string): number {
  const cached = collapsedSpaceWidthCache.get(font)
  if (cached !== undefined) return cached
  const joined = measureSingleLine('A A', font)
  const compact = measureSingleLine('AA', font)
  const width = Math.max(0, joined - compact)
  collapsedSpaceWidthCache.set(font, width)
  return width
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

function cursorsMatch(a: LayoutCursor, b: LayoutCursor): boolean {
  return a.segmentIndex === b.segmentIndex && a.graphemeIndex === b.graphemeIndex
}
