import type { LayoutCursor, PreparedTextWithSegments } from '../../../src/layout.js'

export type { LayoutCursor, PreparedTextWithSegments }

export type PresetKey = 'xiaohongshu' | 'long-image'
export type ThemeKey = 'berry' | 'ink'
export type OrnamentKey = 'editorial' | 'minimal'
export type ImageFitMode = 'cover' | 'contain' | 'fill'

export type InlineStyleName =
  | 'body'
  | 'lead'
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
  | 'eyebrow'

export type InlineSpan = {
  text: string
  style: 'body' | 'strong' | 'em' | 'code' | 'link'
}

export type MarkdownBlock =
  | { kind: 'heading'; depth: 1 | 2 | 3 | 4; spans: InlineSpan[] }
  | { kind: 'paragraph'; spans: InlineSpan[] }
  | { kind: 'blockquote'; spans: InlineSpan[] }
  | { kind: 'pull-quote'; spans: InlineSpan[] }
  | { kind: 'list'; ordered: boolean; items: InlineSpan[][] }
  | { kind: 'code'; code: string }
  | { kind: 'divider' }
  | { kind: 'page-break' }
  | { kind: 'image'; alt: string; url: string; caption?: string; ratio?: string; fit: ImageFitMode }

export type TextStyle = {
  font: string
  color: string
  lineHeight: number
  gapWidth: number
  inlinePaddingX: number
  inlineBackground?: string
  underline?: boolean
}

export type Theme = {
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
  rhythm: {
    leadIndent: number
    paragraphIndent: number
    sectionGap: number
    compactGap: number
  }
}

export type Preset = {
  label: string
  pageWidth: number
  pageHeight: number | null
  marginX: number
  topInset: number
  bottomInset: number
  contentWidth: number
  columnCount: number
  columnGap: number
}

export type TextFragment = {
  text: string
  styleName: InlineStyleName
  width: number
  leadingGap: number
}

export type TextRow = {
  kind: 'text'
  y: number
  height: number
  x: number
  lineWidth?: number
  prefix?: {
    text: string
    styleName: InlineStyleName
    width: number
  }
  fragments: TextFragment[]
  tone?: 'quote' | 'code' | 'pull-quote'
}

export type DividerRow = {
  kind: 'divider'
  y: number
  height: number
}

export type PageBreakRow = {
  kind: 'page-break'
  y: number
  height: number
}

export type ImageRow = {
  kind: 'image'
  y: number
  height: number
  mediaHeight: number
  alt: string
  url: string
  caption?: string
  ratio?: string
  fit: ImageFitMode
}

export type RenderRow = TextRow | DividerRow | PageBreakRow | ImageRow

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

export type PreparedLineFragment = {
  styleName: InlineStyleName
  text: string
  width: number
  leadingGap: number
}

export type PreparedLine = {
  fragments: PreparedLineFragment[]
}

export type TextInlineItem = {
  styleName: InlineStyleName
  prepared: PreparedTextWithSegments
  endCursor: LayoutCursor
  fullText: string
  fullWidth: number
  leadingGap: number
  chromeWidth: number
}
