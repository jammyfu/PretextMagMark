import type {
  DensityKey,
  FontPackKey,
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
    columnCount: 2,
    columnGap: 44,
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

type Palette = Omit<Theme, 'name' | 'styles' | 'rhythm'>
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

export function getTheme(key: ThemeKey, fontPackKey: FontPackKey, densityKey: DensityKey): Theme {
  return createTheme(PALETTES[key], FONT_PACKS[fontPackKey], DENSITIES[densityKey])
}

export function getFontPackLabel(key: FontPackKey): string {
  return FONT_PACKS[key].name
}

export function getDensityLabel(key: DensityKey): string {
  return DENSITIES[key].name
}

function createTheme(palette: Palette & { name: string }, fontPack: FontPack, density: Density): Theme {
  const bodyFont = `400 ${density.bodySize}px ${fontPack.body}`

  return {
    ...palette,
    name: `${palette.name} / ${fontPack.name} / ${density.name}`,
    styles: {
      body: style(bodyFont, palette.ink, density.bodyLeading),
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
      paragraphIndent: density.paragraphIndent,
      sectionGap: density.sectionGap,
      compactGap: density.compactGap,
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
