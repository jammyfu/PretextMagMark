import type { ImageAssetMap } from '../assets/images'
import type { ImageRow, OrnamentKey, PageLayout, RenderDocument, TextRow } from '../domain/types'

export function drawPageToCanvas(
  canvas: HTMLCanvasElement,
  page: PageLayout,
  doc: RenderDocument,
  imageAssets: ImageAssetMap,
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
  drawPage(ctx, width, height, page, doc, imageAssets, ornament)
}

function drawPage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  page: PageLayout,
  doc: RenderDocument,
  imageAssets: ImageAssetMap,
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

  if (preset.columnCount > 1) {
    drawColumnGuides(ctx, doc)
  }

  for (let index = 0; index < page.rows.length; index++) {
    const row = page.rows[index]!
    if (row.kind === 'text') drawTextRow(ctx, row, doc)
    if (row.kind === 'divider') drawDividerRow(ctx, row, doc)
    if (row.kind === 'image') drawImageRow(ctx, row, doc, imageAssets)
  }

  ctx.fillStyle = theme.muted
  ctx.font = `500 18px "PingFang SC", "Segoe UI", sans-serif`
  ctx.fillText('Magazine blocks | Pretext layout | Canvas export', preset.marginX, height - 54)
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

  if (row.tone === 'pull-quote') {
    ctx.fillStyle = theme.accentFaint
    roundRect(ctx, preset.marginX + 34, row.y - 22, preset.contentWidth - 68, row.height + 34, 28)
    ctx.fill()
    ctx.fillStyle = theme.accentSoft
    roundRect(ctx, preset.marginX + 54, row.y - 12, 120, 6, 4)
    ctx.fill()
    if (row.prefix === undefined) {
      ctx.fillStyle = theme.accent
      ctx.font = `700 64px "Iowan Old Style", Georgia, serif`
      ctx.fillText('"', row.x - 40, row.y + row.height * 0.8)
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
  const centerX = doc.preset.marginX + doc.preset.contentWidth / 2
  ctx.strokeStyle = doc.theme.rule
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(doc.preset.marginX, row.y + 16)
  ctx.lineTo(centerX - 42, row.y + 16)
  ctx.moveTo(centerX + 42, row.y + 16)
  ctx.lineTo(doc.preset.marginX + doc.preset.contentWidth, row.y + 16)
  ctx.stroke()

  ctx.fillStyle = doc.theme.accent
  ctx.beginPath()
  ctx.arc(centerX, row.y + 16, 4, 0, Math.PI * 2)
  ctx.fill()
}

function drawColumnGuides(ctx: CanvasRenderingContext2D, doc: RenderDocument): void {
  const { preset, theme } = doc
  const totalGap = preset.columnGap * Math.max(0, preset.columnCount - 1)
  const columnWidth = (preset.contentWidth - totalGap) / preset.columnCount
  for (let index = 1; index < preset.columnCount; index++) {
    const centerX = preset.marginX + index * columnWidth + (index - 0.5) * preset.columnGap
    ctx.strokeStyle = theme.rule
    ctx.lineWidth = 1
    ctx.setLineDash([8, 10])
    ctx.beginPath()
    ctx.moveTo(centerX, 122)
    ctx.lineTo(centerX, 180)
    ctx.stroke()
    ctx.setLineDash([])
  }
}

function drawImageRow(
  ctx: CanvasRenderingContext2D,
  row: ImageRow,
  doc: RenderDocument,
  imageAssets: ImageAssetMap,
): void {
  const { preset, theme } = doc
  const imageX = preset.marginX
  const imageY = row.y
  const imageWidth = preset.contentWidth
  const imageHeight = row.height
  const asset = imageAssets.get(row.url)

  ctx.save()
  roundRect(ctx, imageX, imageY, imageWidth, imageHeight, 28)
  ctx.clip()

  if (asset !== undefined) {
    drawCoverImage(ctx, asset.image, imageX, imageY, imageWidth, imageHeight)
    const overlay = ctx.createLinearGradient(0, imageY, 0, imageY + imageHeight)
    overlay.addColorStop(0, 'rgba(10, 10, 10, 0.02)')
    overlay.addColorStop(1, 'rgba(10, 10, 10, 0.18)')
    ctx.fillStyle = overlay
    ctx.fillRect(imageX, imageY, imageWidth, imageHeight)
  } else {
    ctx.fillStyle = theme.accentFaint
    ctx.fillRect(imageX, imageY, imageWidth, imageHeight)
    ctx.strokeStyle = theme.rule
    ctx.lineWidth = 2
    ctx.strokeRect(imageX + 1, imageY + 1, imageWidth - 2, imageHeight - 2)
    ctx.fillStyle = theme.accent
    ctx.font = `700 24px "Consolas", "SFMono-Regular", ui-monospace, monospace`
    ctx.fillText('IMAGE PLACEHOLDER', imageX + 32, imageY + 54)
  }
  ctx.restore()

  ctx.strokeStyle = theme.rule
  ctx.lineWidth = 2
  roundRect(ctx, imageX, imageY, imageWidth, imageHeight, 28)
  ctx.stroke()

  ctx.fillStyle = asset === undefined ? theme.ink : '#fff7ef'
  ctx.font = doc.theme.styles.h3.font
  ctx.fillText(row.alt.length > 0 ? row.alt : 'No image caption provided', preset.marginX + 32, row.y + 114)
  ctx.fillStyle = theme.muted
  ctx.font = doc.theme.styles.caption.font
  const captionText = row.caption ?? row.url
  wrapCanvasText(ctx, captionText, preset.marginX + 32, row.y + 160, preset.contentWidth - 64, doc.theme.styles.caption.lineHeight)
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const drawWidth = image.naturalWidth * scale
  const drawHeight = image.naturalHeight * scale
  const dx = x + (width - drawWidth) / 2
  const dy = y + (height - drawHeight) / 2
  ctx.drawImage(image, dx, dy, drawWidth, drawHeight)
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
