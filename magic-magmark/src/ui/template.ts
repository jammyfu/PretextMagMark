export function renderAppShell(): string {
  return `
    <main class="shell">
      <section class="panel">
        <header class="panel-head">
          <p class="eyebrow">MagicMagMark / Editorial Social Layout</p>
          <h1>Turn Markdown into publish-ready posters</h1>
          <p class="intro">
            Use the current repository only as the text layout core, then render social cards
            or long images and export high-resolution PNG files here.
          </p>
        </header>

        <div class="controls">
          <section class="section">
            <p class="section-title">Content</p>
            <div class="button-row">
              <label class="file-button secondary">
                Import .md
                <input id="markdown-file" type="file" accept=".md,.markdown,text/markdown,text/plain">
              </label>
              <button id="sample-button" class="secondary" type="button">Load sample</button>
            </div>
            <label>
              File name
              <input id="document-name" type="text" value="magic-magmark">
            </label>
            <label>
              Markdown
              <textarea id="markdown-input" spellcheck="false"></textarea>
            </label>
          </section>

          <section class="section">
            <p class="section-title">Export</p>
            <div class="inline-grid">
              <label>
                Preset
                <select id="preset-select">
                  <option value="xiaohongshu">Xiaohongshu 1080x1440</option>
                  <option value="long-image">Long image 1080xAuto</option>
                </select>
              </label>
              <label>
                Theme
                <select id="theme-select">
                  <option value="berry">Berry Editorial</option>
                  <option value="ink">Ink Column</option>
                </select>
              </label>
              <label>
                Scale
                <select id="scale-select">
                  <option value="2">2x fast preview</option>
                  <option value="3" selected>3x standard</option>
                  <option value="4">4x high res</option>
                </select>
              </label>
              <label>
                Ornament
                <select id="ornament-select">
                  <option value="editorial">Editorial</option>
                  <option value="minimal">Minimal</option>
                </select>
              </label>
            </div>
          </section>

          <section class="section">
            <p class="section-title">Actions</p>
            <div class="button-row">
              <button id="render-button" type="button">Reflow</button>
              <button id="export-current-button" type="button">Export current PNG</button>
              <button id="export-all-button" class="secondary" type="button">Export all pages</button>
            </div>
            <div class="pager">
              <button id="prev-page-button" class="secondary" type="button">Previous</button>
              <button id="next-page-button" class="secondary" type="button">Next</button>
              <span id="page-chip" class="page-chip">Page 1 / 1</span>
            </div>
          </section>

          <section class="meta" id="stats">
            <div>Waiting for layout...</div>
          </section>
        </div>
      </section>

      <section class="preview">
        <header class="preview-head">
          <div class="preview-title">
            <strong id="preview-heading">Live preview</strong>
            <span id="preview-subheading">Pretext-driven line layout with Canvas export</span>
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
