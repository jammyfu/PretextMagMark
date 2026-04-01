import './styles.css'
import {
  SAMPLE_MARKDOWN,
  buildRenderDocument,
  canvasToBlob,
  downloadBlob,
  drawPageToCanvas,
  escapeHtml,
  sanitizeStem,
  type OrnamentKey,
  type PresetKey,
  type RenderDocument,
  type ThemeKey,
} from './engine'

type DomCache = {
  markdownInput: HTMLTextAreaElement
  fileInput: HTMLInputElement
  sampleButton: HTMLButtonElement
  documentName: HTMLInputElement
  presetSelect: HTMLSelectElement
  themeSelect: HTMLSelectElement
  scaleSelect: HTMLSelectElement
  ornamentSelect: HTMLSelectElement
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
  scale: number
  currentPageIndex: number
  document: RenderDocument | null
}

const app = document.getElementById('app')
if (app === null) throw new Error('#app not found')

app.innerHTML = `
  <main class="shell">
    <section class="panel">
      <header class="panel-head">
        <p class="eyebrow">MagicMagMark / Editorial Social Layout</p>
        <h1>把 Markdown 直接变成可发布海报</h1>
        <p class="intro">
          用当前仓库的 Pretext 行布局能力，把内容排成小红书卡片或长图，
          再导出高分辨率 PNG。
        </p>
      </header>

      <div class="controls">
        <section class="section">
          <p class="section-title">素材</p>
          <div class="button-row">
            <label class="file-button secondary">
              导入 .md
              <input id="markdown-file" type="file" accept=".md,.markdown,text/markdown,text/plain">
            </label>
            <button id="sample-button" class="secondary" type="button">载入示例</button>
          </div>
          <label>
            文件名
            <input id="document-name" type="text" value="magic-magmark">
          </label>
          <label>
            Markdown
            <textarea id="markdown-input" spellcheck="false"></textarea>
          </label>
        </section>

        <section class="section">
          <p class="section-title">导出设置</p>
          <div class="inline-grid">
            <label>
              版式
              <select id="preset-select">
                <option value="xiaohongshu">小红书 1080×1440</option>
                <option value="long-image">长图 1080×Auto</option>
              </select>
            </label>
            <label>
              主题
              <select id="theme-select">
                <option value="berry">莓红杂志</option>
                <option value="ink">墨黑专栏</option>
              </select>
            </label>
            <label>
              清晰度
              <select id="scale-select">
                <option value="2">2× 预览快</option>
                <option value="3" selected>3× 标准高清</option>
                <option value="4">4× 超清</option>
              </select>
            </label>
            <label>
              页面装饰
              <select id="ornament-select">
                <option value="editorial">Editorial</option>
                <option value="minimal">Minimal</option>
              </select>
            </label>
          </div>
        </section>

        <section class="section">
          <p class="section-title">操作</p>
          <div class="button-row">
            <button id="render-button" type="button">重新排版</button>
            <button id="export-current-button" type="button">导出当前 PNG</button>
            <button id="export-all-button" class="secondary" type="button">导出全部页</button>
          </div>
          <div class="pager">
            <button id="prev-page-button" class="secondary" type="button">上一页</button>
            <button id="next-page-button" class="secondary" type="button">下一页</button>
            <span id="page-chip" class="page-chip">第 1 / 1 页</span>
          </div>
        </section>

        <section class="meta" id="stats">
          <div>等待排版…</div>
        </section>
      </div>
    </section>

    <section class="preview">
      <header class="preview-head">
        <div class="preview-title">
          <strong id="preview-heading">实时预览</strong>
          <span id="preview-subheading">基于 Pretext 的逐行排版与 Canvas 导出</span>
        </div>
        <div id="preview-meta" class="preview-meta">1080 × 1440</div>
      </header>
      <div class="preview-body">
        <div class="canvas-wrap">
          <canvas id="preview-canvas"></canvas>
        </div>
      </div>
    </section>
  </main>
`

const dom = getDom()

const st: State = {
  source: SAMPLE_MARKDOWN,
  fileStem: 'magic-magmark',
  presetKey: 'xiaohongshu',
  themeKey: 'berry',
  ornament: 'editorial',
  scale: 3,
  currentPageIndex: 0,
  document: null,
}

dom.markdownInput.value = SAMPLE_MARKDOWN

wireEvents()
void document.fonts.ready.then(() => renderFromState())

function getDom(): DomCache {
  return {
    markdownInput: getRequiredElement('markdown-input', HTMLTextAreaElement),
    fileInput: getRequiredElement('markdown-file', HTMLInputElement),
    sampleButton: getRequiredElement('sample-button', HTMLButtonElement),
    documentName: getRequiredElement('document-name', HTMLInputElement),
    presetSelect: getRequiredElement('preset-select', HTMLSelectElement),
    themeSelect: getRequiredElement('theme-select', HTMLSelectElement),
    scaleSelect: getRequiredElement('scale-select', HTMLSelectElement),
    ornamentSelect: getRequiredElement('ornament-select', HTMLSelectElement),
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
  dom.renderButton.addEventListener('click', () => renderFromState())

  dom.sampleButton.addEventListener('click', () => {
    st.source = SAMPLE_MARKDOWN
    st.fileStem = 'magic-magmark'
    st.currentPageIndex = 0
    dom.markdownInput.value = SAMPLE_MARKDOWN
    dom.documentName.value = st.fileStem
    renderFromState()
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
    renderFromState()
  })

  dom.themeSelect.addEventListener('change', () => {
    st.themeKey = dom.themeSelect.value as ThemeKey
    renderFromState()
  })

  dom.ornamentSelect.addEventListener('change', () => {
    st.ornament = dom.ornamentSelect.value as OrnamentKey
    renderFromState()
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
      renderFromState()
    })
  })
}

function renderFromState(): void {
  st.source = dom.markdownInput.value
  st.fileStem = sanitizeStem(dom.documentName.value)
  st.document = buildRenderDocument(st.source, st.presetKey, st.themeKey)
  st.currentPageIndex = Math.min(st.currentPageIndex, st.document.pages.length - 1)
  paintPreview()
  syncUi()
}

function syncUi(): void {
  const doc = st.document
  if (doc === null) return
  const page = doc.pages[st.currentPageIndex]
  if (page === undefined) return

  const pageCount = doc.pages.length
  dom.pageChip.textContent = `第 ${st.currentPageIndex + 1} / ${pageCount} 页`
  dom.prevPageButton.disabled = pageCount <= 1 || st.currentPageIndex === 0
  dom.nextPageButton.disabled = pageCount <= 1 || st.currentPageIndex === pageCount - 1
  dom.exportAllButton.disabled = st.presetKey === 'long-image'

  dom.previewHeading.textContent = doc.preset.label
  dom.previewSubheading.textContent = `${doc.theme.name} · ${doc.blockCount} 个内容块`
  dom.previewMeta.textContent = `${doc.preset.pageWidth} × ${Math.round(page.height)} · ${pageCount} 页`

  const summary = [
    `块数：${doc.blockCount}`,
    `字符数：${doc.sourceLength}`,
    `页数：${pageCount}`,
    `当前尺寸：${doc.preset.pageWidth} × ${Math.round(page.height)}`,
    st.presetKey === 'xiaohongshu' ? '模式：自动分页小红书卡片' : '模式：单张长图',
    `导出倍率：${st.scale}×`,
    '说明：Markdown 图片当前渲染为占位块，便于先确认版式与导出链路。',
  ]
  dom.stats.innerHTML = summary.map(item => `<div>${escapeHtml(item)}</div>`).join('')
}

function paintPreview(): void {
  const doc = st.document
  if (doc === null) return
  const page = doc.pages[st.currentPageIndex]
  if (page === undefined) return
  drawPageToCanvas(dom.previewCanvas, page, doc, 1, st.ornament)
}

async function exportCurrentPage(): Promise<void> {
  const doc = st.document
  if (doc === null) return
  const page = doc.pages[st.currentPageIndex]
  if (page === undefined) return
  const canvas = document.createElement('canvas')
  drawPageToCanvas(canvas, page, doc, st.scale, st.ornament)
  const blob = await canvasToBlob(canvas)
  downloadBlob(blob, `${st.fileStem}-${st.currentPageIndex + 1}.png`)
}

async function exportAllPages(): Promise<void> {
  const doc = st.document
  if (doc === null || st.presetKey !== 'xiaohongshu') return

  for (let index = 0; index < doc.pages.length; index++) {
    const page = doc.pages[index]!
    const canvas = document.createElement('canvas')
    drawPageToCanvas(canvas, page, doc, st.scale, st.ornament)
    const blob = await canvasToBlob(canvas)
    downloadBlob(blob, `${st.fileStem}-${index + 1}.png`)
    if (index < doc.pages.length - 1) {
      await new Promise(resolve => window.setTimeout(resolve, 120))
    }
  }
}
