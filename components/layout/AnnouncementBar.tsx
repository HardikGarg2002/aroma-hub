"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ANNOUNCEMENTS } from "@/lib/navigation";
import { EASE_OUT } from "@/lib/motion";

/** Thin ink bar that rotates through shipping/offer messages. */
export function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % ANNOUNCEMENTS.length),
      4200,
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative z-50 h-9 overflow-hidden bg-ink text-bone">
      <div className="shell flex h-full items-center justify-center">
        <AnimatePresence mode="wait">
          <m.p
            key={index}
            className="text-[10px] font-medium uppercase tracking-[0.2em] md:text-[11px]"
            // The first message is rendered server-side, so it must not start
            // hidden; only the rotations that follow animate in.
            initial={index === 0 ? false : { y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
          >
            {ANNOUNCEMENTS[index]}
          </m.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
