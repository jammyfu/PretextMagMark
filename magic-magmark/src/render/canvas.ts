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
  if (page.kind === 'cover' && page.cover !== undefined) {
    drawCoverPage(ctx, width, height, page, doc, imageAssets, ornament)
    return
  }

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
    if (row.kind === 'text' && (row.tone === 'quote' || row.tone === 'pull-quote')) {
      const previous = page.rows[index - 1]
      const isBlockStart = previous?.kind !== 'text' || previous.tone !== row.tone
      if (isBlockStart) drawToneBlock(ctx, page.rows, index, doc)
    }
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

function drawCoverPage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  page: PageLayout,
  doc: RenderDocument,
  imageAssets: ImageAssetMap,
  ornament: OrnamentKey,
): void {
  if (page.cover?.template === 'feature-split') {
    drawFeatureSplitCover(ctx, width, height, page, doc, imageAssets, ornament)
    return
  }

  const { preset, theme } = doc
  const cover = page.cover!
  ctx.clearRect(0, 0, width, height)

  const bg = ctx.createLinearGradient(0, 0, width, height)
  bg.addColorStop(0, theme.background)
  bg.addColorStop(1, theme.pageEdge)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  const imageUrl = cover.imageUrl
  const coverAsset = imageUrl === undefined ? undefined : imageAssets.get(imageUrl)
  if (coverAsset !== undefined) {
    ctx.save()
    roundRect(ctx, 54, 54, width - 108, height - 108, 42)
    ctx.clip()
    drawPlacedImage(ctx, coverAsset.image, 54, 54, width - 108, height - 108, 'cover')
    const veil = ctx.createLinearGradient(0, 54, 0, height - 54)
    veil.addColorStop(0, 'rgba(24, 18, 16, 0.15)')
    veil.addColorStop(1, 'rgba(24, 18, 16, 0.62)')
    ctx.fillStyle = veil
    ctx.fillRect(54, 54, width - 108, height - 108)
    ctx.restore()
  } else {
    ctx.fillStyle = theme.pageFill
    roundRect(ctx, 54, 54, width - 108, height - 108, 42)
    ctx.fill()
  }

  ctx.strokeStyle = theme.rule
  ctx.lineWidth = 2
  roundRect(ctx, 54, 54, width - 108, height - 108, 42)
  ctx.stroke()

  ctx.fillStyle = coverAsset === undefined ? theme.accent : '#fff4ea'
  ctx.font = `700 18px "PingFang SC", "Segoe UI", sans-serif`
  const kicker = cover.kicker ?? (ornament === 'editorial' ? 'EDITORIAL ISSUE' : 'MAGIC MAGMARK')
  ctx.fillText(kicker.toUpperCase(), preset.marginX, 164)

  const titleLines = wrapTextLines(ctx, cover.title, theme.styles.h1.font, preset.contentWidth - 80)
  ctx.font = theme.styles.h1.font
  ctx.fillStyle = coverAsset === undefined ? theme.ink : '#fff8f0'
  for (let index = 0; index < titleLines.length; index++) {
    ctx.fillText(titleLines[index]!, preset.marginX, 310 + index * theme.styles.h1.lineHeight)
  }

  if (cover.dek !== undefined) {
    const dekY = 310 + titleLines.length * theme.styles.h1.lineHeight + 46
    const dekLines = wrapTextLines(ctx, cover.dek, theme.styles.lead.font, preset.contentWidth - 140)
    ctx.font = theme.styles.lead.font
    ctx.fillStyle = coverAsset === undefined ? theme.muted : '#f3dfd0'
    for (let index = 0; index < dekLines.length; index++) {
      ctx.fillText(dekLines[index]!, preset.marginX, dekY + index * theme.styles.lead.lineHeight)
    }
  }

  ctx.fillStyle = coverAsset === undefined ? theme.muted : '#f3dfd0'
  ctx.font = `600 18px "Consolas", "SFMono-Regular", ui-monospace, monospace`
  ctx.fillText('PRETEXT CORE  |  MAGMARK APP  |  HI-RES EXPORT', preset.marginX, height - 114)
}

function drawFeatureSplitCover(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  page: PageLayout,
  doc: RenderDocument,
  imageAssets: ImageAssetMap,
  ornament: OrnamentKey,
): void {
  const { preset, theme } = doc
  const cover = page.cover!
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = theme.pageFill
  ctx.fillRect(0, 0, width, height)

  const panelWidth = Math.round(width * 0.46)
  const imageUrl = cover.imageUrl
  const coverAsset = imageUrl === undefined ? undefined : imageAssets.get(imageUrl)

  ctx.fillStyle = theme.background
  ctx.fillRect(0, 0, panelWidth, height)
  if (coverAsset !== undefined) {
    drawPlacedImage(ctx, coverAsset.image, panelWidth, 0, width - panelWidth, height, 'cover')
    const wash = ctx.createLinearGradient(panelWidth, 0, width, height)
    wash.addColorStop(0, 'rgba(27, 20, 18, 0.18)')
    wash.addColorStop(1, 'rgba(27, 20, 18, 0.38)')
    ctx.fillStyle = wash
    ctx.fillRect(panelWidth, 0, width - panelWidth, height)
  } else {
    ctx.fillStyle = theme.pageEdge
    ctx.fillRect(panelWidth, 0, width - panelWidth, height)
  }

  ctx.fillStyle = theme.accent
  ctx.fillRect(72, 96, 132, 8)
  ctx.font = `700 18px "PingFang SC", "Segoe UI", sans-serif`
  ctx.fillText((cover.kicker ?? 'FEATURE STORY').toUpperCase(), 72, 152)

  const titleLines = wrapTextLines(ctx, cover.title, theme.styles.h1.font, panelWidth - 144)
  ctx.font = theme.styles.h1.font
  ctx.fillStyle = theme.ink
  for (let index = 0; index < titleLines.length; index++) {
    ctx.fillText(titleLines[index]!, 72, 296 + index * theme.styles.h1.lineHeight)
  }

  if (cover.dek !== undefined) {
    const dekLines = wrapTextLines(ctx, cover.dek, theme.styles.lead.font, panelWidth - 164)
    ctx.font = theme.styles.lead.font
    ctx.fillStyle = theme.muted
    const baseY = 296 + titleLines.length * theme.styles.h1.lineHeight + 42
    for (let index = 0; index < dekLines.length; index++) {
      ctx.fillText(dekLines[index]!, 72, baseY + index * theme.styles.lead.lineHeight)
    }
  }

  ctx.strokeStyle = theme.rule
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(panelWidth, 72)
  ctx.lineTo(panelWidth, height - 72)
  ctx.stroke()

  ctx.fillStyle = ornament === 'editorial' ? theme.muted : theme.accent
  ctx.font = `600 18px "Consolas", "SFMono-Regular", ui-monospace, monospace`
  ctx.fillText('COVER TEMPLATE 02  |  FEATURE SPLIT', 72, height - 108)
}

function drawTextRow(ctx: CanvasRenderingContext2D, row: TextRow, doc: RenderDocument): void {
  const { theme, preset } = doc

  if (row.tone === 'code') {
    ctx.fillStyle = '#f2ede7'
    roundRect(ctx, preset.marginX - 2, row.y - 6, preset.contentWidth + 4, row.height + 8, 18)
    ctx.fill()
  }

  let cursorX = row.x
  const justifyExtra = row.targetWidth !== undefined && row.justifySlots !== undefined && row.justifySlots > 0 && row.lineWidth !== undefined
    ? Math.max(0, (row.targetWidth - row.lineWidth) / row.justifySlots)
    : 0
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
    if (fragment.stretchableBefore) cursorX += justifyExtra

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

  if (row.ornament === 'lead-rule') {
    ctx.strokeStyle = theme.accent
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(row.x, row.y - 12)
    ctx.lineTo(row.x + 72, row.y - 12)
    ctx.stroke()
  }
}

function drawToneBlock(
  ctx: CanvasRenderingContext2D,
  rows: PageLayout['rows'],
  startIndex: number,
  doc: RenderDocument,
): void {
  const startRow = rows[startIndex]
  if (startRow?.kind !== 'text' || (startRow.tone !== 'quote' && startRow.tone !== 'pull-quote')) return

  let endIndex = startIndex
  while (endIndex + 1 < rows.length) {
    const next = rows[endIndex + 1]
    if (next?.kind !== 'text' || next.tone !== startRow.tone) break
    endIndex++
  }

  const endRow = rows[endIndex]
  if (endRow?.kind !== 'text') return

  const { theme, preset } = doc
  const top = startRow.y
  const bottom = endRow.y + endRow.height

  if (startRow.tone === 'quote') {
    const y = top - 16
    const height = bottom - top + 22
    ctx.fillStyle = theme.accentFaint
    roundRect(ctx, preset.marginX - 4, y, preset.contentWidth + 8, height, 22)
    ctx.fill()

    ctx.fillStyle = theme.accent
    roundRect(ctx, preset.marginX - 18, y, 8, height, 6)
    ctx.fill()

    ctx.fillStyle = theme.accent
    ctx.font = `700 54px "Iowan Old Style", Georgia, serif`
    ctx.fillText('"', preset.marginX + 10, startRow.y + startRow.height * 0.72)
    return
  }

  const y = top - 22
  const height = bottom - top + 34
  ctx.fillStyle = theme.accentFaint
  roundRect(ctx, preset.marginX + 34, y, preset.contentWidth - 68, height, 28)
  ctx.fill()

  ctx.fillStyle = theme.accentSoft
  roundRect(ctx, preset.marginX + 54, top - 12, 120, 6, 4)
  ctx.fill()

  ctx.fillStyle = theme.accent
  ctx.font = `700 64px "Iowan Old Style", Georgia, serif`
  ctx.fillText('"', startRow.x - 40, startRow.y + startRow.height * 0.8)
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
  const mediaHeight = row.mediaHeight
  const cardHeight = row.height
  const asset = imageAssets.get(row.url)

  ctx.save()
  roundRect(ctx, imageX, imageY, imageWidth, cardHeight, 28)
  ctx.fillStyle = '#fffaf4'
  ctx.fill()

  ctx.save()
  roundRect(ctx, imageX, imageY, imageWidth, mediaHeight, 28)
  ctx.clip()

  if (asset !== undefined) {
    drawPlacedImage(ctx, asset.image, imageX, imageY, imageWidth, mediaHeight, row.fit)
    const overlay = ctx.createLinearGradient(0, imageY, 0, imageY + mediaHeight)
    overlay.addColorStop(0, 'rgba(10, 10, 10, 0.02)')
    overlay.addColorStop(1, 'rgba(10, 10, 10, 0.18)')
    ctx.fillStyle = overlay
    ctx.fillRect(imageX, imageY, imageWidth, mediaHeight)
  } else {
    ctx.fillStyle = theme.accentFaint
    ctx.fillRect(imageX, imageY, imageWidth, mediaHeight)
    ctx.strokeStyle = theme.rule
    ctx.lineWidth = 2
    ctx.strokeRect(imageX + 1, imageY + 1, imageWidth - 2, mediaHeight - 2)
    ctx.fillStyle = theme.accent
    ctx.font = `700 24px "Consolas", "SFMono-Regular", ui-monospace, monospace`
    ctx.fillText('IMAGE PLACEHOLDER', imageX + 32, imageY + 54)
  }
  ctx.restore()

  ctx.strokeStyle = theme.rule
  ctx.lineWidth = 2
  roundRect(ctx, imageX, imageY, imageWidth, cardHeight, 28)
  ctx.stroke()

  ctx.fillStyle = asset === undefined ? theme.ink : theme.ink
  ctx.font = doc.theme.styles.h3.font
  ctx.fillText(row.alt.length > 0 ? row.alt : 'No image caption provided', preset.marginX + 32, row.y + mediaHeight + 52)
  ctx.fillStyle = theme.muted
  ctx.font = doc.theme.styles.caption.font
  const metaText = [row.caption ?? row.url, row.ratio ?? 'auto', row.fit].join('  |  ')
  wrapCanvasText(ctx, metaText, preset.marginX + 32, row.y + mediaHeight + 92, preset.contentWidth - 64, doc.theme.styles.caption.lineHeight)
  ctx.restore()
}

function drawPlacedImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  fit: ImageRow['fit'],
): void {
  if (fit === 'fill') {
    ctx.drawImage(image, x, y, width, height)
    return
  }

  const scale = fit === 'contain'
    ? Math.min(width / image.naturalWidth, height / image.naturalHeight)
    : Math.max(width / image.naturalWidth, height / image.naturalHeight)
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

function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, font: string, maxWidth: number): string[] {
  ctx.font = font
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (let index = 0; index < words.length; index++) {
    const word = words[index]!
    const candidate = line.length === 0 ? word : `${line} ${word}`
    if (ctx.measureText(candidate).width > maxWidth && line.length > 0) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line.length > 0) lines.push(line)
  return lines
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
