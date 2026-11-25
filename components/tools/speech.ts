"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

type Recognition = {
  lang: string; interimResults: boolean; continuous: boolean;
  start(): void; stop(): void; abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

const noop = () => () => {};

function recognitionCtor(): (new () => Recognition) | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/** Speech-to-text through the browser (Chrome, Edge, Safari). Albanian depends on the browser's speech service. */
export function useSpeechInput(lang: "sq" | "en", onText: (text: string, final: boolean) => void) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supported = useSyncExternalStore(noop, () => Boolean(recognitionCtor()), () => false);
  const rec = useRef<Recognition | null>(null);
  const cb = useRef(onText);
  useEffect(() => { cb.current = onText; }, [onText]);

  const stop = useCallback(() => { rec.current?.stop(); }, []);
  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) { setError("unsupported"); return; }
    setError(null);
    const r = new Ctor();
    r.lang = lang === "en" ? "en-US" : "sq-AL";
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e) => {
      const results = Array.from(e.results);
      const text = results.map((x) => x[0].transcript).join(" ");
      cb.current(text, results.every((x) => x.isFinal));
    };
    r.onerror = (e) => { setError(e.error); setListening(false); };
    r.onend = () => setListening(false);
    rec.current = r;
    r.start();
    setListening(true);
  }, [lang]);

  useEffect(() => () => rec.current?.abort(), []);
  return { listening, start, stop, error, supported };
}

/** Text-to-speech; picks an Albanian voice when the device has one, otherwise the default voice. */
export function speak(text: string, lang: "sq" | "en") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "en" ? "en-US" : "sq-AL";
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
  return true;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
