import { imageSrc } from "@/lib/images"
import { cn } from "@/lib/utils"

interface CoverImageProps {
  cover: {
    medium: string | null
    large: string | null
    extraLarge: string | null
    color: string | null
  } | null
  alt: string
  /** CSS `sizes` for the rendered width. */
  sizes: string
  /** Load immediately (above the fold) instead of lazily. */
  priority?: boolean
  className?: string
}

/**
 * Cover art at 2:3 using AniList's three sizes (about 100, 230 and 460 px
 * wide). The cover's own colour fills the box while the image loads.
 */
export function CoverImage({
  cover,
  alt,
  sizes,
  priority = false,
  className,
}: CoverImageProps) {
  const sources = [
    [cover?.medium, 100],
    [cover?.large, 230],
    [cover?.extraLarge, 460],
  ] as const
  const srcSet = sources
    .filter(([url]) => url)
    .map(([url, width]) => `${imageSrc(url)} ${width}w`)
    .join(", ")
  const src = imageSrc(cover?.large ?? cover?.extraLarge ?? cover?.medium)

  return (
    <div
      className={cn(
        "relative aspect-[2/3] overflow-hidden bg-muted",
        className,
      )}
      style={cover?.color ? { backgroundColor: cover.color } : undefined}
    >
      {src ? (
        // A plain <img>: AniList already serves sized files, so Next's image
        // optimizer would only add cost.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          srcSet={srcSet || undefined}
          sizes={sizes}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}
    </div>
  )
}
