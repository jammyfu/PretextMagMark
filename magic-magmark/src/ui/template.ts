export type UiLanguageKey = 'zh' | 'en'

type UiCopy = {
  appEyebrow: string
  appTitle: string
  appIntro: string
  uiLanguageLabel: string
  contentTitle: string
  importMarkdown: string
  importImages: string
  loadSample: string
  fileName: string
  markdown: string
  exportTitle: string
  preset: string
  theme: string
  fontPack: string
  languageMode: string
  density: string
  scale: string
  ornament: string
  cover: string
  actionsTitle: string
  reflow: string
  exportCurrent: string
  exportAll: string
  previous: string
  next: string
  waiting: string
  livePreview: string
  previewSubheading: string
  presetOptions: Record<'xiaohongshu' | 'long-image', string>
  themeOptions: Record<'berry' | 'ink' | 'forest', string>
  densityOptions: Record<'airy' | 'balanced' | 'compact', string>
  scaleOptions: Record<'2' | '3' | '4', string>
  ornamentOptions: Record<'editorial' | 'minimal', string>
  coverOptions: Record<'portrait' | 'feature-split', string>
  languageModeOptions: Record<'mixed' | 'zh' | 'en', string>
}

const UI_COPY: Record<UiLanguageKey, UiCopy> = {
  zh: {
    appEyebrow: 'MagicMagMark / 杂志感社交排版',
    appTitle: '把 Markdown 变成可发布的杂志风海报',
    appIntro: '只把当前仓库当作文字排版内核，在这里完成社交卡片、长图排版和高分辨率 PNG 导出。',
    uiLanguageLabel: '界面语言',
    contentTitle: '内容',
    importMarkdown: '导入 .md',
    importImages: '导入图片',
    loadSample: '加载示例',
    fileName: '文件名',
    markdown: 'Markdown',
    exportTitle: '输出设置',
    preset: '预设',
    theme: '主题',
    fontPack: '字体包',
    languageMode: '排版语言',
    density: '密度',
    scale: '导出倍率',
    ornament: '装饰风格',
    cover: '封面模板',
    actionsTitle: '操作',
    reflow: '重新排版',
    exportCurrent: '导出当前 PNG',
    exportAll: '导出全部页面',
    previous: '上一页',
    next: '下一页',
    waiting: '等待排版...',
    livePreview: '实时预览',
    previewSubheading: '由 Pretext 驱动的逐行排版与 Canvas 导出',
    presetOptions: {
      xiaohongshu: '小红书 1080x1440',
      'long-image': '长图 1080xAuto',
    },
    themeOptions: {
      berry: '莓果刊物',
      ink: '墨色专栏',
      forest: '森林评论',
    },
    densityOptions: {
      airy: '疏朗',
      balanced: '平衡',
      compact: '紧凑',
    },
    scaleOptions: {
      '2': '2x 快速预览',
      '3': '3x 标准',
      '4': '4x 高清',
    },
    ornamentOptions: {
      editorial: '编辑感',
      minimal: '极简',
    },
    coverOptions: {
      portrait: '人物封面',
      'feature-split': '专题分栏',
    },
    languageModeOptions: {
      mixed: '中英混排',
      zh: '中文',
      en: 'English',
    },
  },
  en: {
    appEyebrow: 'MagicMagMark / Editorial Social Layout',
    appTitle: 'Turn Markdown into publish-ready posters',
    appIntro: 'Use the current repository only as the text layout core, then render social cards or long images and export high-resolution PNG files here.',
    uiLanguageLabel: 'UI language',
    contentTitle: 'Content',
    importMarkdown: 'Import .md',
    importImages: 'Import images',
    loadSample: 'Load sample',
    fileName: 'File name',
    markdown: 'Markdown',
    exportTitle: 'Export',
    preset: 'Preset',
    theme: 'Theme',
    fontPack: 'Font pack',
    languageMode: 'Layout language',
    density: 'Density',
    scale: 'Scale',
    ornament: 'Ornament',
    cover: 'Cover',
    actionsTitle: 'Actions',
    reflow: 'Reflow',
    exportCurrent: 'Export current PNG',
    exportAll: 'Export all pages',
    previous: 'Previous',
    next: 'Next',
    waiting: 'Waiting for layout...',
    livePreview: 'Live preview',
    previewSubheading: 'Pretext-driven line layout with Canvas export',
    presetOptions: {
      xiaohongshu: 'Xiaohongshu 1080x1440',
      'long-image': 'Long image 1080xAuto',
    },
    themeOptions: {
      berry: 'Berry Editorial',
      ink: 'Ink Column',
      forest: 'Forest Review',
    },
    densityOptions: {
      airy: 'Airy',
      balanced: 'Balanced',
      compact: 'Compact',
    },
    scaleOptions: {
      '2': '2x fast preview',
      '3': '3x standard',
      '4': '4x high res',
    },
    ornamentOptions: {
      editorial: 'Editorial',
      minimal: 'Minimal',
    },
    coverOptions: {
      portrait: 'Portrait cover',
      'feature-split': 'Feature split',
    },
    languageModeOptions: {
      mixed: 'Mixed',
      zh: '中文',
      en: 'English',
    },
  },
}

export function renderAppShell(): string {
  return `
    <main class="shell">
      <section class="panel">
        <header class="panel-head">
          <p id="app-eyebrow" class="eyebrow"></p>
          <h1 id="app-title"></h1>
          <p id="app-intro" class="intro"></p>
        </header>

        <div class="controls">
          <section class="section">
            <div class="inline-grid">
              <label>
                <span id="ui-language-label"></span>
                <select id="ui-language-select">
                  <option value="zh">中文</option>
                  <option value="en">English</option>
                </select>
              </label>
            </div>
          </section>

          <section class="section">
            <p id="content-title" class="section-title"></p>
            <div class="button-row">
              <label class="file-button secondary">
                <span id="import-markdown-label"></span>
                <input id="markdown-file" type="file" accept=".md,.markdown,text/markdown,text/plain">
              </label>
              <label class="file-button secondary">
                <span id="import-images-label"></span>
                <input id="image-files" type="file" accept="image/*" multiple>
              </label>
              <button id="sample-button" class="secondary" type="button"></button>
            </div>
            <label>
              <span id="file-name-label"></span>
              <input id="document-name" type="text" value="magic-magmark">
            </label>
            <label>
              <span id="markdown-label"></span>
              <textarea id="markdown-input" spellcheck="false"></textarea>
            </label>
          </section>

          <section class="section">
            <p id="export-title" class="section-title"></p>
            <div class="inline-grid">
              <label>
                <span id="preset-label"></span>
                <select id="preset-select">
                  <option value="xiaohongshu"></option>
                  <option value="long-image"></option>
                </select>
              </label>
              <label>
                <span id="theme-label"></span>
                <select id="theme-select">
                  <option value="berry"></option>
                  <option value="ink"></option>
                  <option value="forest"></option>
                </select>
              </label>
              <label>
                <span id="font-pack-label"></span>
                <select id="font-pack-select">
                  <option value="serif-cn">Source Han Serif</option>
                  <option value="songti">Songti Review</option>
                  <option value="sans-editorial">Sans Editorial</option>
                  <option value="serif-en">English Serif</option>
                </select>
              </label>
              <label>
                <span id="language-mode-label"></span>
                <select id="language-mode-select">
                  <option value="mixed" selected></option>
                  <option value="zh"></option>
                  <option value="en"></option>
                </select>
              </label>
              <label>
                <span id="density-label"></span>
                <select id="density-select">
                  <option value="airy"></option>
                  <option value="balanced" selected></option>
                  <option value="compact"></option>
                </select>
              </label>
              <label>
                <span id="scale-label"></span>
                <select id="scale-select">
                  <option value="2"></option>
                  <option value="3" selected></option>
                  <option value="4"></option>
                </select>
              </label>
              <label>
                <span id="ornament-label"></span>
                <select id="ornament-select">
                  <option value="editorial"></option>
                  <option value="minimal"></option>
                </select>
              </label>
              <label>
                <span id="cover-label"></span>
                <select id="cover-template-select">
                  <option value="portrait"></option>
                  <option value="feature-split"></option>
                </select>
              </label>
            </div>
          </section>

          <section class="section">
            <p id="actions-title" class="section-title"></p>
            <div class="button-row">
              <button id="render-button" type="button"></button>
              <button id="export-current-button" type="button"></button>
              <button id="export-all-button" class="secondary" type="button"></button>
            </div>
            <div class="pager">
              <button id="prev-page-button" class="secondary" type="button"></button>
              <button id="next-page-button" class="secondary" type="button"></button>
              <span id="page-chip" class="page-chip"></span>
            </div>
          </section>

          <section class="meta" id="stats">
            <div id="waiting-copy"></div>
          </section>
        </div>
      </section>

      <section class="preview">
        <header class="preview-head">
          <div class="preview-title">
            <strong id="preview-heading"></strong>
            <span id="preview-subheading"></span>
          </div>
          <div id="preview-meta" class="preview-meta">1080 x 1440</div>
        </header>
        <div class="preview-body">
          <div class="canvas-wrap">
            <canvas id="preview-canvas"></canvas>
          </div>
        </div>
      </section>
    </main>
  `
}

export function getUiCopy(locale: UiLanguageKey): UiCopy {
  return UI_COPY[locale]
}
