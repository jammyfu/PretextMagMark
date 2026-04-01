import type {
  DensityKey,
  FontPackKey,
  LanguageModeKey,
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
    marginX: 84,
    topInset: 116,
    bottomInset: 104,
    contentWidth: 1080 - 168,
    columnCount: 1,
    columnGap: 0,
  },
  'long-image': {
    label: 'Long image 1080xAuto',
    pageWidth: 1080,
    pageHeight: null,
    marginX: 92,
    topInset: 120,
    bottomInset: 120,
    contentWidth: 1080 - 184,
    columnCount: 1,
    columnGap: 0,
  },
}

type Palette = Omit<Theme, 'name' | 'languageMode' | 'styles' | 'rhythm' | 'composition'>
type FontPack = {
  name: string
  body: string
  sans: string
  mono: string
  display: string
}
type Density = {
  name: string
  bodySize: number
  bodyLeading: number
  leadSize: number
  leadLeading: number
  h1Size: number
  h1Leading: number
  h2Size: number
  h2Leading: number
  h3Size: number
  h3Leading: number
  quoteSize: number
  quoteLeading: number
  captionSize: number
  captionLeading: number
  eyebrowSize: number
  eyebrowLeading: number
  paragraphIndent: number
  sectionGap: number
  compactGap: number
}

const PALETTES: Record<ThemeKey, Palette & { name: string }> = {
  berry: {
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
  },
  ink: {
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
  },
  forest: {
    name: 'Forest Review',
    background: '#e4e0d3',
    pageFill: '#fbfaf5',
    pageEdge: '#e2ddd0',
    ink: '#16211c',
    muted: '#5c695f',
    accent: '#295c49',
    accentSoft: '#cfe0d5',
    accentFaint: '#edf4ef',
    rule: '#d6ddd7',
  },
}

const FONT_PACKS: Record<FontPackKey, FontPack> = {
  'serif-cn': {
    name: 'Source Han Serif',
    body: '"Source Han Serif SC", "Noto Serif SC", "Songti SC", Georgia, serif',
    sans: '"PingFang SC", "Hiragino Sans GB", "Segoe UI", sans-serif',
    mono: '"Cascadia Code", "Consolas", "SFMono-Regular", ui-monospace, monospace',
    display: '"Iowan Old Style", "Palatino Linotype", "Source Han Serif SC", Georgia, serif',
  },
  songti: {
    name: 'Songti Review',
    body: '"Songti SC", "STSong", "Noto Serif SC", serif',
    sans: '"PingFang SC", "Hiragino Sans GB", "Segoe UI", sans-serif',
    mono: '"Cascadia Code", "Consolas", "SFMono-Regular", ui-monospace, monospace',
    display: '"Songti SC", "STSong", "Source Han Serif SC", serif',
  },
  'sans-editorial': {
    name: 'Sans Editorial',
    body: '"IBM Plex Sans", "PingFang SC", "Segoe UI", sans-serif',
    sans: '"IBM Plex Sans", "PingFang SC", "Segoe UI", sans-serif',
    mono: '"IBM Plex Mono", "Cascadia Code", "Consolas", monospace',
    display: '"IBM Plex Sans", "Avenir Next", "PingFang SC", sans-serif',
  },
  'serif-en': {
    name: 'English Serif',
    body: '"Iowan Old Style", "Baskerville", "Georgia", serif',
    sans: '"Avenir Next", "Helvetica Neue", "Segoe UI", sans-serif',
    mono: '"IBM Plex Mono", "Cascadia Code", "Consolas", monospace',
    display: '"Iowan Old Style", "Baskerville", "Georgia", serif',
  },
}

const DENSITIES: Record<DensityKey, Density> = {
  airy: {
    name: 'Airy',
    bodySize: 32,
    bodyLeading: 58,
    leadSize: 40,
    leadLeading: 66,
    h1Size: 76,
    h1Leading: 92,
    h2Size: 46,
    h2Leading: 66,
    h3Size: 33,
    h3Leading: 48,
    quoteSize: 34,
    quoteLeading: 58,
    captionSize: 21,
    captionLeading: 34,
    eyebrowSize: 18,
    eyebrowLeading: 30,
    paragraphIndent: 34,
    sectionGap: 30,
    compactGap: 16,
  },
  balanced: {
    name: 'Balanced',
    bodySize: 31,
    bodyLeading: 54,
    leadSize: 38,
    leadLeading: 62,
    h1Size: 72,
    h1Leading: 86,
    h2Size: 44,
    h2Leading: 62,
    h3Size: 32,
    h3Leading: 46,
    quoteSize: 33,
    quoteLeading: 56,
    captionSize: 21,
    captionLeading: 32,
    eyebrowSize: 18,
    eyebrowLeading: 28,
    paragraphIndent: 34,
    sectionGap: 26,
    compactGap: 14,
  },
  compact: {
    name: 'Compact',
    bodySize: 29,
    bodyLeading: 48,
    leadSize: 35,
    leadLeading: 56,
    h1Size: 66,
    h1Leading: 76,
    h2Size: 40,
    h2Leading: 56,
    h3Size: 30,
    h3Leading: 42,
    quoteSize: 31,
    quoteLeading: 50,
    captionSize: 19,
    captionLeading: 28,
    eyebrowSize: 17,
    eyebrowLeading: 24,
    paragraphIndent: 28,
    sectionGap: 22,
    compactGap: 12,
  },
}

export function getPreset(key: PresetKey): Preset {
  return PRESETS[key]
}

export function getTheme(key: ThemeKey, fontPackKey: FontPackKey, densityKey: DensityKey, languageMode: LanguageModeKey): Theme {
  return createTheme(PALETTES[key], FONT_PACKS[resolveFontPackKeyForLanguage(fontPackKey, languageMode)], DENSITIES[densityKey], languageMode)
}

export function getFontPackLabel(key: FontPackKey): string {
  return FONT_PACKS[key].name
}

export function getDensityLabel(key: DensityKey): string {
  return DENSITIES[key].name
}

export function resolveFontPackKeyForLanguage(fontPackKey: FontPackKey, languageMode: LanguageModeKey): FontPackKey {
  if (languageMode === 'en' && fontPackKey !== 'serif-en' && fontPackKey !== 'sans-editorial') {
    return 'serif-en'
  }
  if (languageMode === 'zh' && fontPackKey === 'serif-en') {
    return 'serif-cn'
  }
  return fontPackKey
}

function createTheme(
  palette: Palette & { name: string },
  fontPack: FontPack,
  density: Density,
  languageMode: LanguageModeKey,
): Theme {
  const composition = createComposition(languageMode)
  const paragraphIndent = resolveParagraphIndent(languageMode, density.paragraphIndent)
  const compactGap = resolveCompactGap(languageMode, density.compactGap)

  return {
    ...palette,
    languageMode,
    name: `${palette.name} / ${fontPack.name} / ${density.name} / ${languageMode}`,
    styles: {
      body: style(`400 ${density.bodySize}px ${fontPack.body}`, palette.ink, density.bodyLeading),
      lead: style(`500 ${density.leadSize}px ${fontPack.display}`, palette.ink, density.leadLeading),
      strong: style(`700 ${density.bodySize}px ${fontPack.body}`, palette.ink, density.bodyLeading),
      em: style(`400 italic ${density.bodySize}px ${fontPack.body}`, palette.ink, density.bodyLeading),
      code: { ...style(`600 24px ${fontPack.mono}`, palette.ink, 42), inlinePaddingX: 14, inlineBackground: palette.accentFaint },
      link: { ...style(`600 ${density.bodySize}px ${fontPack.sans}`, palette.accent, density.bodyLeading), underline: true },
      h1: style(`700 ${density.h1Size}px ${fontPack.display}`, palette.ink, density.h1Leading),
      h2: style(`700 ${density.h2Size}px ${fontPack.sans}`, palette.ink, density.h2Leading),
      h3: style(`700 ${density.h3Size}px ${fontPack.sans}`, palette.ink, density.h3Leading),
      quote: style(`500 ${density.quoteSize}px ${fontPack.display}`, palette.ink, density.quoteLeading),
      caption: style(`500 ${density.captionSize}px ${fontPack.sans}`, palette.muted, density.captionLeading),
      'list-prefix': style(`700 ${density.bodySize}px ${fontPack.sans}`, palette.accent, density.bodyLeading),
      eyebrow: style(`700 ${density.eyebrowSize}px ${fontPack.sans}`, palette.accent, density.eyebrowLeading),
    },
    rhythm: {
      leadIndent: 0,
      paragraphIndent,
      sectionGap: density.sectionGap,
      compactGap,
    },
    composition,
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

function resolveParagraphIndent(languageMode: LanguageModeKey, fallback: number): number {
  switch (languageMode) {
    case 'zh':
      return fallback
    case 'en':
      return 0
    default:
      return Math.round(fallback * 0.45)
  }
}

function resolveCompactGap(languageMode: LanguageModeKey, fallback: number): number {
  switch (languageMode) {
    case 'zh':
      return fallback
    case 'en':
      return fallback + 6
    default:
      return fallback + 3
  }
}

function createComposition(languageMode: LanguageModeKey): Theme['composition'] {
  switch (languageMode) {
    case 'zh':
      return {
        bodyMeasureRatio: 1,
        leadMeasureRatio: 0.96,
        h1MeasureRatio: 0.9,
        h2MeasureRatio: 0.94,
        h3MeasureRatio: 0.96,
        quoteMeasureRatio: 0.94,
        pullQuoteMeasureRatio: 0.82,
        justifyMinFillRatio: 0.74,
        justifyMinSlots: 2,
        justifyMaxAverageExpansion: 14,
      }
    case 'en':
      return {
        bodyMeasureRatio: 0.92,
        leadMeasureRatio: 0.86,
        h1MeasureRatio: 0.76,
        h2MeasureRatio: 0.82,
        h3MeasureRatio: 0.88,
        quoteMeasureRatio: 0.86,
        pullQuoteMeasureRatio: 0.78,
        justifyMinFillRatio: 0.9,
        justifyMinSlots: 4,
        justifyMaxAverageExpansion: 7,
      }
    default:
      return {
        bodyMeasureRatio: 0.96,
        leadMeasureRatio: 0.9,
        h1MeasureRatio: 0.82,
        h2MeasureRatio: 0.88,
        h3MeasureRatio: 0.92,
        quoteMeasureRatio: 0.9,
        pullQuoteMeasureRatio: 0.8,
        justifyMinFillRatio: 0.84,
        justifyMinSlots: 3,
        justifyMaxAverageExpansion: 9,
      }
  }
}
