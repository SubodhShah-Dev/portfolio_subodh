import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface LightboxProps {
  images: string[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

/**
 * Full-screen image viewer — role="dialog" with Esc/arrow keyboard control
 * and a focus grab on open. Rendering is driven by the parent (gallery
 * button clicks), so it mounts only while a slide is selected.
 */
export function Lightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: LightboxProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight")
        onIndexChange((index + 1) % images.length);
      else if (event.key === "ArrowLeft")
        onIndexChange((index - 1 + images.length) % images.length);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [index, images.length, onClose, onIndexChange]);

  const src = images[index];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        aria-label="Close image viewer"
        onClick={onClose}
        className="absolute top-4 right-4 flex size-10 cursor-pointer items-center justify-center border border-white/25 text-white transition-colors hover:border-white hover:bg-white/10"
      >
        <X aria-hidden="true" className="size-5" />
      </button>

      <div
        className="relative flex max-h-full max-w-5xl items-center gap-3"
        onClick={(event) => event.stopPropagation()}
      >
        {images.length > 1 && (
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => onIndexChange((index - 1 + images.length) % images.length)}
            className="flex size-10 shrink-0 cursor-pointer items-center justify-center border border-white/25 text-white transition-colors hover:border-white hover:bg-white/10"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
        )}

        <figure className="min-w-0">
          <img
            src={src}
            alt={`Gallery image ${index + 1} of ${images.length}`}
            className="max-h-[75vh] max-w-full border border-white/15 object-contain"
          />
          <figcaption className="mt-3 text-center font-meta text-xs tracking-[0.14em] text-white/70 tabular-nums">
            {index + 1} / {images.length}
          </figcaption>
        </figure>

        {images.length > 1 && (
          <button
            type="button"
            aria-label="Next image"
            onClick={() => onIndexChange((index + 1) % images.length)}
            className="flex size-10 shrink-0 cursor-pointer items-center justify-center border border-white/25 text-white transition-colors hover:border-white hover:bg-white/10"
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        )}
      </div>
    </div>
  );
}
