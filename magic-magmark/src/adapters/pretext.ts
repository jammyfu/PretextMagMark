import { layoutNextLine, prepareWithSegments, setLocale } from '../../../src/layout.js'
import type {
  InlineSpan,
  InlineStyleName,
  LayoutCursor,
  LanguageModeKey,
  PreparedLine,
  PreparedLineFragment,
  PreparedTextWithSegments,
  TextInlineItem,
  Theme,
} from '../domain/types'

const preparedCache = new Map<string, PreparedTextWithSegments>()
const collapsedSpaceWidthCache = new Map<string, number>()
const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
let currentLanguageMode: LanguageModeKey = 'mixed'

export function configureLanguageMode(languageMode: LanguageModeKey): void {
  if (currentLanguageMode === languageMode) return
  currentLanguageMode = languageMode
  preparedCache.clear()
  collapsedSpaceWidthCache.clear()
  setLocale(resolveLocale(languageMode))
}

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
            stretchableBefore: item.leadingGap > 0 ? item.stretchableGapBefore : undefined,
          })
          lineWidth += fullWidth
          remainingWidth = Math.max(0, safeWidth - lineWidth)
          itemIndex++
          continue
        }

        if (fragments.length > 0 && item.keepWholeIfPossible && item.fullWidth + item.chromeWidth <= safeWidth) {
          break lineLoop
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
        stretchableBefore: item.leadingGap > 0 ? item.stretchableGapBefore : undefined,
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
    const tokens = tokenizeSpanText(span.text, styleName)
    let carryGap = pendingGap
    for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
      const token = tokens[tokenIndex]!
      if (token.kind === 'space') {
        carryGap = gapWidth
        continue
      }

      const prepared = getPrepared(token.text, style.font)
      const fullLine = layoutNextLine(prepared, { segmentIndex: 0, graphemeIndex: 0 }, 100_000)
      if (fullLine === null) continue

      items.push({
        styleName,
        prepared,
        endCursor: fullLine.end,
        fullText: fullLine.text,
        fullWidth: fullLine.width,
        leadingGap: items.length === 0 ? 0 : carryGap,
        stretchableGapBefore: items.length > 0 && token.stretchableBefore,
        keepWholeIfPossible: token.keepWholeIfPossible,
        chromeWidth: style.inlinePaddingX * 2,
      })
      carryGap = 0
    }
    pendingGap = carryGap
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
  const key = `${currentLanguageMode}\n${font}\n${text}`
  const cached = preparedCache.get(key)
  if (cached !== undefined) return cached
  const prepared = prepareWithSegments(text, font)
  preparedCache.set(key, prepared)
  return prepared
}

function cursorsMatch(a: LayoutCursor, b: LayoutCursor): boolean {
  return a.segmentIndex === b.segmentIndex && a.graphemeIndex === b.graphemeIndex
}

function tokenizeSpanText(
  text: string,
  styleName: InlineStyleName,
): Array<{ kind: 'space' } | { kind: 'text', text: string, stretchableBefore: boolean, keepWholeIfPossible: boolean }> {
  const trimmed = text.trim()
  if (trimmed.length === 0) return []

  const parts = text.split(/(\s+)/).filter(part => part.length > 0)
  const tokens: Array<{ kind: 'space' } | { kind: 'text', text: string, stretchableBefore: boolean, keepWholeIfPossible: boolean }> = []

  for (let index = 0; index < parts.length; index++) {
    const part = parts[index]!
    if (/^\s+$/.test(part)) {
      tokens.push({ kind: 'space' })
      continue
    }

    if (shouldSegmentForIdeographicJustification(part, styleName)) {
      const graphemes = [...graphemeSegmenter.segment(part)].map(item => item.segment)
      for (let graphemeIndex = 0; graphemeIndex < graphemes.length; graphemeIndex++) {
        const grapheme = graphemes[graphemeIndex]!
        tokens.push({
          kind: 'text',
          text: grapheme,
          stretchableBefore: graphemeIndex > 0,
          keepWholeIfPossible: false,
        })
      }
      continue
    }

    tokens.push({
      kind: 'text',
      text: part,
      stretchableBefore: tokens.length > 0,
      keepWholeIfPossible: shouldKeepWholeToken(part),
    })
  }

  return tokens
}

function shouldSegmentForIdeographicJustification(text: string, styleName: InlineStyleName): boolean {
  if (styleName === 'h1' || styleName === 'h2' || styleName === 'h3' || styleName === 'eyebrow' || styleName === 'lead') {
    return false
  }
  if (currentLanguageMode === 'en') return false
  return !/\s/.test(text) && /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(text)
}

function shouldKeepWholeToken(text: string): boolean {
  if (text.length <= 1) return false
  if (!/[A-Za-z]/.test(text)) return false
  if (/[/:@?=#&_~]/.test(text)) return false

  const trimmed = text
    .replace(/^[("'[\]]+/g, '')
    .replace(/[.,;:!?)]*$/g, '')
  if (trimmed.length <= 1) return false

  if (/^[A-Za-z]+(?:['’-][A-Za-z]+)*$/.test(trimmed)) return true
  if (/^[A-Za-z0-9]+(?:[._+-][A-Za-z0-9]+)+$/.test(trimmed)) return true
  if (/^[A-Za-z]+[0-9]+(?:\.[0-9]+)*$/.test(trimmed)) return true
  return false
}

function resolveLocale(languageMode: LanguageModeKey): string | undefined {
  switch (languageMode) {
    case 'zh':
      return 'zh-CN'
    case 'en':
      return 'en-US'
    default:
      return undefined
  }
}
