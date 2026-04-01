import type { ImageRow, OrnamentKey, PageLayout, RenderDocument, TextRow } from '../domain/types'

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
  ctx.fillText('Magazine rhythm | Pretext layout | Canvas export', preset.marginX, height - 54)
}

function drawTextRow(ctx: CanvasRenderingContext2D, row: TextRow, doc: RenderDocument): void {
  const { theme, preset } = doc
  const firstStyleName = row.fragments[0]?.styleName

  if (row.tone === 'quote') {
    ctx.fillStyle = theme.accentFaint
    roundRect(ctx, preset.marginX - 4, row.y - 16, preset.contentWidth + 8, row.height + 22, 22)
    ctx.fill()
    ctx.fillStyle = theme.accent
    roundRect(ctx, preset.marginX - 18, row.y - 16, 8, row.height + 22, 6)
    ctx.fill()
    if (row.prefix === undefined) {
      ctx.fillStyle = theme.accent
      ctx.font = `700 54px "Iowan Old Style", Georgia, serif`
      ctx.fillText('"', preset.marginX + 10, row.y + row.height * 0.72)
    }
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

  if (firstStyleName === 'lead') {
    ctx.strokeStyle = theme.accent
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(row.x, row.y - 12)
    ctx.lineTo(row.x + 72, row.y - 12)
    ctx.stroke()
  }
}

function drawDividerRow(ctx: CanvasRenderingContext2D, row: { y: number }, doc: RenderDocument): void {
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
  ctx.font = doc.theme.styles.h3.font
  ctx.fillText(row.alt.length > 0 ? row.alt : 'No image caption provided', preset.marginX + 32, row.y + 114)
  ctx.fillStyle = theme.muted
  ctx.font = doc.theme.styles.caption.font
  wrapCanvasText(ctx, row.url, preset.marginX + 32, row.y + 160, preset.contentWidth - 64, doc.theme.styles.caption.lineHeight)
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
