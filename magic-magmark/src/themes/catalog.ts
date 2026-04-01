import type {
  Preset,
  PresetKey,
  TextStyle,
  Theme,
  ThemeKey,
} from '../domain/types'

const PRESETS: Record<PresetKey, Preset> = {
  xiaohongshu: {
    label: 'Xiaohongshu 1080x1440',
    pageWidth: 1080,
    pageHeight: 1440,
    marginX: 88,
    topInset: 120,
    bottomInset: 110,
    contentWidth: 1080 - 176,
  },
  'long-image': {
    label: 'Long image 1080xAuto',
    pageWidth: 1080,
    pageHeight: null,
    marginX: 92,
    topInset: 120,
    bottomInset: 120,
    contentWidth: 1080 - 184,
  },
}

const THEMES: Record<ThemeKey, Theme> = {
  berry: createTheme({
    name: 'Berry Editorial',
    background: '#f7ead8',
    pageFill: '#fff9f1',
    pageEdge: '#f2e4d7',
    ink: '#271816',
    muted: '#7f6258',
    accent: '#d24f39',
    accentSoft: '#f6d3c4',
    accentFaint: '#faeee6',
    rule: '#e8d7cb',
  }),
  ink: createTheme({
    name: 'Ink Column',
    background: '#dbd3c7',
    pageFill: '#faf7f1',
    pageEdge: '#e9e1d7',
    ink: '#191615',
    muted: '#6d655e',
    accent: '#7b3327',
    accentSoft: '#e6ccc4',
    accentFaint: '#f2eae6',
    rule: '#ddd4ca',
  }),
}

export function getPreset(key: PresetKey): Preset {
  return PRESETS[key]
}

export function getTheme(key: ThemeKey): Theme {
  return THEMES[key]
}

function createTheme(input: Omit<Theme, 'styles' | 'rhythm'>): Theme {
  const bodyFontFamily = '"Source Han Serif SC", "Noto Serif SC", "Songti SC", Georgia, serif'
  const sansFamily = '"PingFang SC", "Hiragino Sans GB", "Segoe UI", sans-serif'
  const monoFamily = '"Cascadia Code", "Consolas", "SFMono-Regular", ui-monospace, monospace'
  const displayFamily = '"Iowan Old Style", "Palatino Linotype", "Source Han Serif SC", Georgia, serif'
  const baseBodyFont = `400 31px ${bodyFontFamily}`

  return {
    ...input,
    styles: {
      body: style(baseBodyFont, input.ink, 54),
      lead: style(`500 38px ${displayFamily}`, input.ink, 62),
      strong: style(`700 31px ${bodyFontFamily}`, input.ink, 54),
      em: style(`400 italic 31px ${bodyFontFamily}`, input.ink, 54),
      code: { ...style(`600 24px ${monoFamily}`, input.ink, 42), inlinePaddingX: 14, inlineBackground: input.accentFaint },
      link: { ...style(`600 31px ${sansFamily}`, input.accent, 54), underline: true },
      h1: style(`700 72px ${displayFamily}`, input.ink, 86),
      h2: style(`700 44px ${sansFamily}`, input.ink, 62),
      h3: style(`700 32px ${sansFamily}`, input.ink, 46),
      quote: style(`500 33px ${displayFamily}`, input.ink, 56),
      caption: style(`500 21px ${sansFamily}`, input.muted, 32),
      'list-prefix': style(`700 31px ${sansFamily}`, input.accent, 54),
    },
    rhythm: {
      leadIndent: 0,
      paragraphIndent: 34,
      sectionGap: 26,
      compactGap: 14,
    },
  }
}

function style(font: string, color: string, lineHeight: number): TextStyle {
  return {
    font,
    color,
    lineHeight,
    gapWidth: 0,
    inlinePaddingX: 0,
  }
}
