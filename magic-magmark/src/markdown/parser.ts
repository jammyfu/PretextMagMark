import type { InlineSpan, MarkdownBlock } from '../domain/types'

export function parseMarkdown(source: string): MarkdownBlock[] {
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
