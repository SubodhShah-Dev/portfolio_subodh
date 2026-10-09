import { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

interface ProfileStackProps {
  images: string[];
  name: string;
}

interface DepthSlot {
  x: number;
  y: number;
  rotate: number;
  /** Absent = fully visible; 0 = hidden behind deeper slots. */
  opacity?: number;
}

/** Depth slots for stacked cards: {x, y, rotation} offset from the front. */
const DEPTHS: readonly DepthSlot[] = [
  { x: 0, y: 0, rotate: -2 },
  { x: 16, y: 10, rotate: 5 },
  { x: -14, y: 16, rotate: -7 },
];

/** Depths past the visible fan stay mounted but fade out. */
const HIDDEN_DEPTH: DepthSlot = { x: 0, y: 0, rotate: 0, opacity: 0 };

const SWIPE_THRESHOLD = 60;
const SWIPE_VELOCITY = 400;

function pad(index: number): string {
  return String(index).padStart(2, "0");
}

/**
 * Stacked profile-photo deck (§8) — pop-framed photos fanned behind the
 * front card. Click or swipe cycles: the incoming photo takes the top
 * z-index immediately and springs forward from its offset, the outgoing one
 * slips behind. One photo renders as a static double-frame (no button, no
 * counter); reduced motion swaps cards instantly.
 */
export function ProfileStack({ images, name }: ProfileStackProps) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const dragged = useRef(false);

  const count = images.length;
  if (count === 0) return null;

  const advance = (step: number): void => {
    setIndex((current) => (current + step + count) % count);
  };

  const frame =
    "absolute inset-0 overflow-hidden rounded-chunk border-2 border-ink bg-raised shadow-pop";
  const plate =
    "absolute inset-0 translate-x-2 translate-y-2 rotate-3 rounded-chunk border-2 border-ink bg-signal";

  if (count === 1) {
    return (
      <div className="relative size-44 sm:size-52 lg:size-72">
        <span aria-hidden="true" className={plate} />
        <div className={frame}>
          <img
            src={images[0]}
            alt={`${name} — profile`}
            className="h-full w-full object-cover"
            draggable={false}
          />
        </div>
      </div>
    );
  }

  const handleClick = (): void => {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    advance(1);
  };

  return (
    <motion.button
      type="button"
      aria-label="Show next profile photo"
      onClick={handleClick}
      drag={reduce === true ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.35}
      dragSnapToOrigin
      onDragStart={() => {
        dragged.current = true;
      }}
      onDragEnd={(_, info) => {
        if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -SWIPE_VELOCITY) {
          advance(1);
        } else if (
          info.offset.x > SWIPE_THRESHOLD ||
          info.velocity.x > SWIPE_VELOCITY
        ) {
          advance(-1);
        }
      }}
      className="relative block size-44 cursor-pointer touch-pan-y sm:size-52 lg:size-72"
    >
      <span aria-hidden="true" className={plate} />
      {images.map((src, position) => {
        const depth = ((position - index) % count + count) % count;
        const slot: DepthSlot = depth < DEPTHS.length ? DEPTHS[depth] : HIDDEN_DEPTH;
        return (
          <motion.div
            key={src}
            className={frame}
            style={{ zIndex: count - depth }}
            initial={false}
            animate={{
              x: slot.x,
              y: slot.y,
              rotate: reduce === true ? 0 : slot.rotate,
              opacity: slot.opacity ?? 1,
            }}
            transition={
              reduce === true
                ? { duration: 0 }
                : { type: "spring", stiffness: 300, damping: 26, mass: 0.9 }
            }
          >
            <img
              src={src}
              alt={`${name} — profile photo ${position + 1} of ${count}`}
              className="h-full w-full object-cover"
              draggable={false}
            />
          </motion.div>
        );
      })}
      {/* Position chip rides on the front card's corner so it stays glued
          to the deck at every breakpoint instead of floating below it. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-full border-2 border-ink bg-canvas px-2.5 py-0.5 font-meta text-xs font-medium tracking-[0.14em] text-ink tabular-nums shadow-pop-sm"
      >
        {pad(index + 1)} / {pad(count)}
      </span>
    </motion.button>
  );
}
