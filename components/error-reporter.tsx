"use client";

import { useEffect } from "react";

/** Sends uncaught browser errors to /api/monitor: the message, the script file and the page path, nothing else. */
export function ErrorReporter() {
  useEffect(() => {
    let sent = 0;
    const send = (kind: "error" | "rejection", message: string, source?: string) => {
      if (sent++ >= 5 || !message) return;
      const body = JSON.stringify({ kind, message: message.slice(0, 300), source: source?.split("?")[0].slice(0, 200), page: location.pathname.slice(0, 200) });
      navigator.sendBeacon?.("/api/monitor", new Blob([body], { type: "application/json" }));
    };
    const onError = (e: ErrorEvent) => send("error", e.message, e.filename);
    const onRejection = (e: PromiseRejectionEvent) => send("rejection", e.reason instanceof Error ? e.reason.message : String(e.reason));
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => { window.removeEventListener("error", onError); window.removeEventListener("unhandledrejection", onRejection); };
  }, []);
  return null;
}
