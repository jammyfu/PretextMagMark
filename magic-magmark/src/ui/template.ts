export type UiLanguageKey = 'zh' | 'en'

type UiCopy = {
  appEyebrow: string
  appTitle: string
  appIntro: string
  modeStudio: string
  modeSource: string
  modePreview: string
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
  editorHeading: string
  editorHint: string
  statsHeading: string
  presetOptions: Record<'xiaohongshu' | 'long-image', string>
  themeOptions: Record<'berry' | 'ink' | 'forest', string>
  densityOptions: Record<'airy' | 'balanced' | 'compact', string>
  scaleOptions: Record<'2' | '3' | '4', string>
  ornamentOptions: Record<'editorial' | 'minimal', string>
  coverOptions: Record<'none' | 'portrait' | 'feature-split', string>
  languageModeOptions: Record<'mixed' | 'zh' | 'en', string>
}

const UI_COPY: Record<UiLanguageKey, UiCopy> = {
  zh: {
    appEyebrow: 'MagicMagMark / Editorial Studio',
    appTitle: 'MagMark 风格编辑台',
    appIntro: '把编辑逻辑集中到顶部，下面专注内容编辑和成品预览。',
    modeStudio: 'Studio',
    modeSource: 'Markdown',
    modePreview: 'Preview',
    uiLanguageLabel: '界面语言',
    contentTitle: '内容',
    importMarkdown: '导入 Markdown',
    importImages: '导入图片',
    loadSample: '载入示例',
    fileName: '文件名',
    markdown: 'Markdown 源文',
    exportTitle: '版式',
    preset: '预设',
    theme: '主题',
    fontPack: '字体包',
    languageMode: '排版语言',
    density: '密度',
    scale: '导出倍率',
    ornament: '装饰',
    cover: '封面',
    actionsTitle: '操作',
    reflow: '重新排版',
    exportCurrent: '导出当前页',
    exportAll: '导出全部',
    previous: '上一页',
    next: '下一页',
    waiting: '等待生成排版结果…',
    livePreview: '设备预览',
    previewSubheading: '社交卡片与长图输出预览',
    editorHeading: '编辑区域',
    editorHint: '在这里直接修改 Markdown 内容。',
    statsHeading: '文档信息',
    presetOptions: {
      xiaohongshu: '小红书 1080×1440',
      'long-image': '长图 1080×Auto',
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
      '2': '2x 预览',
      '3': '3x 标准',
      '4': '4x 高清',
    },
    ornamentOptions: {
      editorial: '编辑感',
      minimal: '极简',
    },
    coverOptions: {
      none: '不生成封面',
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
    appEyebrow: 'MagicMagMark / Editorial Studio',
    appTitle: 'MagMark-style editorial workspace',
    appIntro: 'Move editing logic to the top so the lower area focuses on content and preview.',
    modeStudio: 'Studio',
    modeSource: 'Markdown',
    modePreview: 'Preview',
    uiLanguageLabel: 'UI language',
    contentTitle: 'Content',
    importMarkdown: 'Import Markdown',
    importImages: 'Import images',
    loadSample: 'Load sample',
    fileName: 'File name',
    markdown: 'Markdown source',
    exportTitle: 'Layout',
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
    exportCurrent: 'Export current',
    exportAll: 'Export all',
    previous: 'Previous',
    next: 'Next',
    waiting: 'Waiting for layout output…',
    livePreview: 'Device preview',
    previewSubheading: 'Preview social cards and long-image output',
    editorHeading: 'Editor',
    editorHint: 'Edit Markdown directly in the workspace below.',
    statsHeading: 'Document info',
    presetOptions: {
      xiaohongshu: 'Xiaohongshu 1080×1440',
      'long-image': 'Long image 1080×Auto',
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
      '2': '2x preview',
      '3': '3x standard',
      '4': '4x high-res',
    },
    ornamentOptions: {
      editorial: 'Editorial',
      minimal: 'Minimal',
    },
    coverOptions: {
      none: 'No cover page',
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
    <main class="workspace-shell">
      <header class="workspace-topbar">
        <div class="workspace-brand">
          <p id="app-eyebrow" class="workspace-eyebrow"></p>
          <div class="workspace-title-group">
            <h1 id="app-title" class="workspace-title"></h1>
            <p id="app-intro" class="workspace-intro"></p>
          </div>
        </div>

        <div class="workspace-modebar">
          <span id="mode-studio" class="mode-pill mode-pill-active"></span>
          <span id="mode-source" class="mode-pill"></span>
          <span id="mode-preview" class="mode-pill"></span>
        </div>
      </header>

      <section class="control-deck">
        <div class="control-card control-card-files">
          <p id="content-title" class="control-kicker"></p>
          <div class="control-row">
            <label>
              <span id="ui-language-label"></span>
              <select id="ui-language-select">
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </label>
            <label>
              <span id="file-name-label"></span>
              <input id="document-name" type="text" value="magic-magmark">
            </label>
          </div>
          <div class="toolbar-row">
            <label class="tool-button tool-button-soft">
              <span id="import-markdown-label"></span>
              <input id="markdown-file" type="file" accept=".md,.markdown,text/markdown,text/plain">
            </label>
            <label class="tool-button tool-button-soft">
              <span id="import-images-label"></span>
              <input id="image-files" type="file" accept="image/*" multiple>
            </label>
            <button id="sample-button" class="tool-button tool-button-soft" type="button"></button>
          </div>
        </div>

        <div class="control-card control-card-layout">
          <p id="export-title" class="control-kicker"></p>
          <div class="control-grid">
            <label><span id="preset-label"></span><select id="preset-select"><option value="xiaohongshu"></option><option value="long-image"></option></select></label>
            <label><span id="theme-label"></span><select id="theme-select"><option value="berry"></option><option value="ink"></option><option value="forest"></option></select></label>
            <label><span id="font-pack-label"></span><select id="font-pack-select"><option value="serif-cn">Source Han Serif</option><option value="songti">Songti Review</option><option value="sans-editorial">Sans Editorial</option><option value="serif-en">English Serif</option></select></label>
            <label><span id="language-mode-label"></span><select id="language-mode-select"><option value="mixed" selected></option><option value="zh"></option><option value="en"></option></select></label>
            <label><span id="density-label"></span><select id="density-select"><option value="airy"></option><option value="balanced" selected></option><option value="compact"></option></select></label>
            <label><span id="scale-label"></span><select id="scale-select"><option value="2"></option><option value="3" selected></option><option value="4"></option></select></label>
            <label><span id="ornament-label"></span><select id="ornament-select"><option value="editorial"></option><option value="minimal"></option></select></label>
            <label><span id="cover-label"></span><select id="cover-template-select"><option value="none"></option><option value="portrait"></option><option value="feature-split"></option></select></label>
          </div>
        </div>

        <div class="control-card control-card-actions">
          <p id="actions-title" class="control-kicker"></p>
          <span id="stats-heading" class="visually-hidden"></span>
          <div class="toolbar-row">
            <button id="render-button" class="tool-button tool-button-primary" type="button"></button>
            <button id="export-current-button" class="tool-button tool-button-soft" type="button"></button>
            <button id="export-all-button" class="tool-button tool-button-soft" type="button"></button>
          </div>
          <div class="pager-row">
            <button id="prev-page-button" class="tool-button tool-button-soft" type="button"></button>
            <span id="page-chip" class="page-chip"></span>
            <button id="next-page-button" class="tool-button tool-button-soft" type="button"></button>
          </div>
          <div class="stats-card" id="stats">
            <div id="waiting-copy"></div>
          </div>
        </div>
      </section>

      <section class="workspace-main">
        <section class="editor-stage">
          <header class="editor-stage-head">
            <div>
              <p id="editor-heading" class="control-kicker"></p>
              <p id="editor-hint" class="editor-note"></p>
            </div>
          </header>
          <label class="editor-label">
            <span id="markdown-label"></span>
            <textarea id="markdown-input" spellcheck="false"></textarea>
          </label>
        </section>

        <section class="preview-stage">
          <header class="preview-stage-head">
            <div class="preview-stage-title">
              <strong id="preview-heading"></strong>
              <span id="preview-subheading"></span>
            </div>
            <div id="preview-meta" class="preview-meta">1080 × 1440</div>
          </header>

          <div class="preview-stage-body">
            <div class="device-frame">
              <div class="device-notch"></div>
              <div class="canvas-wrap">
                <canvas id="preview-canvas"></canvas>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  `
}

export function getUiCopy(locale: UiLanguageKey): UiCopy {
  return UI_COPY[locale]
}
