"use client";

import { useEffect, useRef, useState } from "react";

const MEDIUM_SPEED = 40;

export function useMarqueeSpeed(speedPxPerSec = MEDIUM_SPEED) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState<number | null>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const update = () => {
      if (el.scrollWidth > 0) {
        setDuration(el.scrollWidth / 2 / speedPxPerSec);
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [speedPxPerSec]);

  return { trackRef, duration };
}