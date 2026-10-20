export type PreloadAudioAsset = { id: string; url: string; approved?: boolean }

export function AudioPreloader({ assets }: { assets: Array<PreloadAudioAsset | undefined> }) {
  return (
    <div hidden aria-hidden="true">
      {assets.filter((asset): asset is PreloadAudioAsset => Boolean(asset && asset.approved !== false))
        .slice(0, 2)
        .map((asset) => <audio key={asset.id} src={asset.url} preload="metadata" />)}
    </div>
  )
}
