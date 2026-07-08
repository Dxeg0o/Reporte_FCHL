"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Anima un número desde 0 hasta `target` al montar, con requestAnimationFrame.
 * Respeta `prefers-reduced-motion`: en ese caso devuelve el valor final de una.
 */
export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || target === 0) {
      setValue(target);
      return;
    }

    let raf = 0;
    let start = 0;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic

    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / durationMs, 1);
      setValue(target * ease(p));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}
