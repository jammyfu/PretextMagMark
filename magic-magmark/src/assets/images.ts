import type { RenderDocument } from '../domain/types'

export type LoadedImageAsset = {
  key: string
  source: string
  image: HTMLImageElement
  width: number
  height: number
  objectUrl?: string
}

export type ImageAssetMap = Map<string, LoadedImageAsset>

export async function resolveImageAssets(doc: RenderDocument, files: File[]): Promise<ImageAssetMap> {
  const refs = collectImageRefs(doc)
  const fileLookup = createFileLookup(files)
  const assets: ImageAssetMap = new Map()

  for (let index = 0; index < refs.length; index++) {
    const ref = refs[index]!
    const source = resolveImageSource(ref, fileLookup)
    if (source === null) continue

    try {
      const image = await loadImage(source.source)
      assets.set(ref, {
        key: ref,
        source: source.source,
        image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        objectUrl: source.objectUrl,
      })
    } catch {
      if (source.objectUrl !== undefined) URL.revokeObjectURL(source.objectUrl)
    }
  }

  return assets
}

export function releaseImageAssets(assets: ImageAssetMap): void {
  for (const asset of assets.values()) {
    if (asset.objectUrl !== undefined) {
      URL.revokeObjectURL(asset.objectUrl)
    }
  }
}

export function countImageRefs(doc: RenderDocument): number {
  return collectImageRefs(doc).length
}

function collectImageRefs(doc: RenderDocument): string[] {
  const refs = new Set<string>()
  for (let pageIndex = 0; pageIndex < doc.pages.length; pageIndex++) {
    const page = doc.pages[pageIndex]!
    for (let rowIndex = 0; rowIndex < page.rows.length; rowIndex++) {
      const row = page.rows[rowIndex]!
      if (row.kind === 'image') refs.add(row.url)
    }
  }
  return [...refs]
}

function createFileLookup(files: File[]): Map<string, File> {
  const lookup = new Map<string, File>()
  for (let index = 0; index < files.length; index++) {
    const file = files[index]!
    lookup.set(file.name.toLowerCase(), file)
  }
  return lookup
}

function resolveImageSource(
  ref: string,
  fileLookup: Map<string, File>,
): { source: string, objectUrl?: string } | null {
  if (ref.startsWith('data:') || /^https?:\/\//i.test(ref) || ref.startsWith('/')) {
    return { source: ref }
  }

  const normalized = normalizeRef(ref)
  const matchedFile = fileLookup.get(normalized.toLowerCase()) ?? fileLookup.get(getBaseName(normalized).toLowerCase())
  if (matchedFile !== undefined) {
    const objectUrl = URL.createObjectURL(matchedFile)
    return { source: objectUrl, objectUrl }
  }

  try {
    return { source: new URL(ref, window.location.href).href }
  } catch {
    return null
  }
}

function normalizeRef(ref: string): string {
  return ref.replace(/\\/g, '/').replace(/^\.\/+/, '')
}

function getBaseName(ref: string): string {
  const parts = ref.split('/')
  return parts[parts.length - 1] ?? ref
}

async function loadImage(source: string): Promise<HTMLImageElement> {
  const image = new Image()
  if (/^https?:\/\//i.test(source)) {
    image.crossOrigin = 'anonymous'
  }

  const loaded = new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load image: ${source}`))
  })

  image.src = source
  if ('decode' in image) {
    try {
      await image.decode()
    } catch {
      // Fall back to onload for browsers that reject decode on cached images.
    }
  }
  return await loaded
}
