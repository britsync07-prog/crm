"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname } from "next/navigation";

export default function NavigationProgressBar() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    // When the pathname changes, navigation has completed
    setIsNavigating(false);
  }, [pathname]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      // Only trigger for internal links that are different from current pathname
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("#") &&
        href !== pathname &&
        !target.hasAttribute("target") &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey
      ) {
        startTransition(() => {
          setIsNavigating(true);
        });
      }
    };

    window.addEventListener("click", handleAnchorClick, { capture: true });
    return () => {
      window.removeEventListener("click", handleAnchorClick, { capture: true });
    };
  }, [pathname]);

  if (!isNavigating) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[2.5px] z-[9999] pointer-events-none overflow-hidden bg-transparent"
    >
      <div className="h-full bg-gradient-to-r from-[#012169] via-blue-500 to-[#c8102e] animate-[pulse_0.8s_ease-in-out_infinite] w-full origin-left transition-all duration-300" />
    </div>
  );
}
