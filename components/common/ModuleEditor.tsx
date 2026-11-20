"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ModuleCard } from "./ModuleCard";

/** Reveal an inline editor opened below a long registry without creating a modal. */
export function ModuleEditor({ children, label }: { children: ReactNode; label: string }) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const opener = document.activeElement;
    panel.current?.focus({ preventScroll: true });
    panel.current?.scrollIntoView({ block: "start", behavior: "instant" });
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);
  return (
    <section ref={panel} tabIndex={-1} aria-label={label} className="scroll-mt-6 outline-none">
      <ModuleCard className="p-5 sm:p-6">{children}</ModuleCard>
    </section>
  );
}
