import { useRef } from "react";

interface ProjectMediaProps {
  imageUrl?: string;
  videoUrl?: string;
  /** Decorative alt — the card title carries the accessible name. */
  alt: string;
}

/**
 * Framed project media (§13) — thumbnail in a border-2 frame; when a preview
 * video exists it sits on top and plays muted on hover (pauses and rewinds on
 * leave). Reduced-motion users keep the still image; touch devices without
 * hover simply never trigger playback.
 */
export function ProjectMedia({ imageUrl, videoUrl, alt }: ProjectMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasImage = imageUrl !== undefined && imageUrl.trim() !== "";
  const hasVideo = videoUrl !== undefined && videoUrl.trim() !== "";

  if (!hasImage && !hasVideo) return null;

  const start = (): void => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    void videoRef.current?.play().catch(() => {});
  };
  const stop = (): void => {
    const video = videoRef.current;
    if (video === null) return;
    video.pause();
    video.currentTime = 0;
  };

  return (
    <div className="relative aspect-video overflow-hidden border-2 border-ink bg-surface-hover">
      {hasImage && (
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />
      )}
      {hasVideo && (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={hasImage ? imageUrl : undefined}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
          onMouseEnter={start}
          onMouseLeave={stop}
          className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-500 group-hover:scale-[1.06] ${
            hasImage ? "opacity-0 group-hover:opacity-100" : ""
          }`}
        />
      )}
    </div>
  );
}
