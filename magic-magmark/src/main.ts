import './styles.css'
import { countImageRefs, releaseImageAssets, resolveImageAssets } from './assets/images'
import { SAMPLE_MARKDOWN } from './content/sample'
import type { CoverTemplateKey, OrnamentKey, PresetKey, RenderDocument, ThemeKey } from './domain/types'
import { canvasToBlob, downloadBlob, escapeHtml, sanitizeStem } from './export/png'
import { buildRenderDocument } from './layout/compose'
import { drawPageToCanvas } from './render/canvas'
import { renderAppShell } from './ui/template'

type DomCache = {
  markdownInput: HTMLTextAreaElement
  fileInput: HTMLInputElement
  imageFiles: HTMLInputElement
  sampleButton: HTMLButtonElement
  documentName: HTMLInputElement
  presetSelect: HTMLSelectElement
  themeSelect: HTMLSelectElement
  scaleSelect: HTMLSelectElement
  ornamentSelect: HTMLSelectElement
  coverTemplateSelect: HTMLSelectElement
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
  coverTemplate: CoverTemplateKey
  scale: number
  currentPageIndex: number
  document: RenderDocument | null
  imageAssets: Awaited<ReturnType<typeof resolveImageAssets>>
  imageFiles: File[]
  renderToken: number
}

const app = document.getElementById('app')
if (app === null) throw new Error('#app not found')

app.innerHTML = renderAppShell()

const dom = getDom()

const st: State = {
  source: SAMPLE_MARKDOWN,
  fileStem: 'magic-magmark',
  presetKey: 'xiaohongshu',
  themeKey: 'berry',
  ornament: 'editorial',
  coverTemplate: 'portrait',
  scale: 3,
  currentPageIndex: 0,
  document: null,
  imageAssets: new Map(),
  imageFiles: [],
  renderToken: 0,
}

dom.markdownInput.value = SAMPLE_MARKDOWN

wireEvents()
void document.fonts.ready.then(() => renderFromState())

function getDom(): DomCache {
  return {
    markdownInput: getRequiredElement('markdown-input', HTMLTextAreaElement),
    fileInput: getRequiredElement('markdown-file', HTMLInputElement),
    imageFiles: getRequiredElement('image-files', HTMLInputElement),
    sampleButton: getRequiredElement('sample-button', HTMLButtonElement),
    documentName: getRequiredElement('document-name', HTMLInputElement),
    presetSelect: getRequiredElement('preset-select', HTMLSelectElement),
    themeSelect: getRequiredElement('theme-select', HTMLSelectElement),
    scaleSelect: getRequiredElement('scale-select', HTMLSelectElement),
    ornamentSelect: getRequiredElement('ornament-select', HTMLSelectElement),
    coverTemplateSelect: getRequiredElement('cover-template-select', HTMLSelectElement),
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
  dom.renderButton.addEventListener('click', () => {
    void renderFromState()
  })

  dom.sampleButton.addEventListener('click', () => {
    st.source = SAMPLE_MARKDOWN
    st.fileStem = 'magic-magmark'
    st.currentPageIndex = 0
    dom.markdownInput.value = SAMPLE_MARKDOWN
    dom.documentName.value = st.fileStem
    void renderFromState()
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
    void renderFromState()
  })

  dom.themeSelect.addEventListener('change', () => {
    st.themeKey = dom.themeSelect.value as ThemeKey
    void renderFromState()
  })

  dom.ornamentSelect.addEventListener('change', () => {
    st.ornament = dom.ornamentSelect.value as OrnamentKey
    void renderFromState()
  })

  dom.coverTemplateSelect.addEventListener('change', () => {
    st.coverTemplate = dom.coverTemplateSelect.value as CoverTemplateKey
    void renderFromState()
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
      void renderFromState()
    })
  })

  dom.imageFiles.addEventListener('change', () => {
    st.imageFiles = Array.from(dom.imageFiles.files ?? [])
    void renderFromState()
  })
}

async function renderFromState(): Promise<void> {
  const renderToken = ++st.renderToken
  st.source = dom.markdownInput.value
  st.fileStem = sanitizeStem(dom.documentName.value)
  st.document = buildRenderDocument(st.source, st.presetKey, st.themeKey, st.coverTemplate)
  st.currentPageIndex = Math.min(st.currentPageIndex, st.document.pages.length - 1)
  releaseImageAssets(st.imageAssets)
  st.imageAssets = new Map()
  paintPreview()
  syncUi()

  const assets = await resolveImageAssets(st.document, st.imageFiles)
  if (renderToken !== st.renderToken) {
    releaseImageAssets(assets)
    return
  }

  st.imageAssets = assets
  paintPreview()
  syncUi()
}

function syncUi(): void {
  const doc = st.document
  if (doc === null) return
  const page = doc.pages[st.currentPageIndex]
  if (page === undefined) return

  const pageCount = doc.pages.length
  dom.pageChip.textContent = `Page ${st.currentPageIndex + 1} / ${pageCount}`
  dom.prevPageButton.disabled = pageCount <= 1 || st.currentPageIndex === 0
  dom.nextPageButton.disabled = pageCount <= 1 || st.currentPageIndex === pageCount - 1
  dom.exportAllButton.disabled = st.presetKey === 'long-image'

  dom.previewHeading.textContent = doc.preset.label
  dom.previewSubheading.textContent = `${doc.theme.name} | ${doc.blockCount} blocks`
  dom.previewMeta.textContent = `${doc.preset.pageWidth} x ${Math.round(page.height)} | ${pageCount} pages`

  const summary = [
    `Blocks: ${doc.blockCount}`,
    `Characters: ${doc.sourceLength}`,
    `Pages: ${pageCount}`,
    `Canvas size: ${doc.preset.pageWidth} x ${Math.round(page.height)}`,
    `Grid: ${doc.preset.columnCount} column${doc.preset.columnCount > 1 ? 's' : ''}${doc.preset.columnCount > 1 ? `, ${doc.preset.columnGap}px gap` : ''}`,
    st.presetKey === 'xiaohongshu' ? 'Mode: auto-paginated social cards' : 'Mode: single long image',
    `Cover template: ${st.coverTemplate}`,
    `Export scale: ${st.scale}x`,
    `Images resolved: ${st.imageAssets.size} / ${countImageRefs(doc)}`,
    'Tip: imported images are matched by file name to Markdown image URLs.',
  ]
  dom.stats.innerHTML = summary.map(item => `<div>${escapeHtml(item)}</div>`).join('')
}

function paintPreview(): void {
  const doc = st.document
  if (doc === null) return
  const page = doc.pages[st.currentPageIndex]
  if (page === undefined) return
  drawPageToCanvas(dom.previewCanvas, page, doc, st.imageAssets, 1, st.ornament)
}

async function exportCurrentPage(): Promise<void> {
  const doc = st.document
  if (doc === null) return
  const page = doc.pages[st.currentPageIndex]
  if (page === undefined) return
  const canvas = document.createElement('canvas')
  drawPageToCanvas(canvas, page, doc, st.imageAssets, st.scale, st.ornament)
  const blob = await canvasToBlob(canvas)
  downloadBlob(blob, `${st.fileStem}-${st.currentPageIndex + 1}.png`)
}

async function exportAllPages(): Promise<void> {
  const doc = st.document
  if (doc === null || st.presetKey !== 'xiaohongshu') return

  for (let index = 0; index < doc.pages.length; index++) {
    const page = doc.pages[index]!
    const canvas = document.createElement('canvas')
    drawPageToCanvas(canvas, page, doc, st.imageAssets, st.scale, st.ornament)
    const blob = await canvasToBlob(canvas)
    downloadBlob(blob, `${st.fileStem}-${index + 1}.png`)
    if (index < doc.pages.length - 1) {
      await new Promise(resolve => window.setTimeout(resolve, 120))
    }
  }
}
