"use client";

import { useEffect, useState } from "react";

export default function AddToHomeNudge() {
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed
    if (localStorage.getItem("pwa-nudge-dismissed")) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = (navigator as { standalone?: boolean }).standalone === true;
    const isInstalledAndroid = window.matchMedia("(display-mode: standalone)").matches;

    if (standalone || isInstalledAndroid) return;

    setIsIOS(ios);

    // Show after 30 seconds on first visit
    const t = setTimeout(() => setVisible(true), 30000);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem("pwa-nudge-dismissed", "1");
  }

  if (!visible) return null;

  return (
    <div
      className="fixed left-4 right-4 z-40 rounded-2xl border border-border bg-surface p-4 shadow-xl"
      style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Add to home screen</p>
          <p className="mt-0.5 text-xs text-muted">
            {isIOS
              ? "Tap the Share button, then \"Add to Home Screen\""
              : "Tap the browser menu, then \"Add to Home Screen\""}
          </p>
        </div>
        <button onClick={dismiss} className="flex-shrink-0 text-muted hover:text-foreground transition-colors p-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
