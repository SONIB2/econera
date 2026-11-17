"use client";

import { ArrowLeft, ArrowRight, Link2, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { defaultPavilionAngle, finishes, lighting, pavilionView, roofProfiles, type readPavilion } from "@/lib/pavilion";

type Pavilion = ReturnType<typeof readPavilion>;

export function PavilionBuilder({ initial }: { initial: Pavilion }) {
  const [finish, setFinish] = useState(initial.finish);
  const [light, setLight] = useState(initial.light);
  const [roof, setRoof] = useState(initial.roof);
  const [angle, setAngle] = useState(initial.angle);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const drag = useRef<{ x: number; angle: number } | null>(null);
  const shareField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shareUrl && !copied) shareField.current?.select();
  }, [shareUrl, copied]);

  function startRotation(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    drag.current = { x: event.clientX, angle };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveRotation(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || !event.isPrimary) return;
    setAngle(drag.current.angle + (event.clientX - drag.current.x) * .55);
    clearShare();
  }

  async function share() {
    const link = new URL("/tregimi", window.location.origin);
    link.search = new URLSearchParams({ material: finish.id, drita: light.id, catia: roof.id, kendi: String(pavilionView(angle)) }).toString();
    link.hash = "pavijoni";
    setShareUrl(link.href);
    try {
      await navigator.clipboard.writeText(link.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function clearShare() {
    setShareUrl("");
    setCopied(false);
  }

  return <section id="pavijoni" className="pavilion" aria-labelledby="pavilion-title">
    <div className="container pavilion-layout">
      <div className="pavilion-stage" data-light={light.id} data-finish={finish.id} data-roof={roof.id}>
        <div className="pavilion-canvas" aria-hidden="true" onPointerDown={startRotation} onPointerMove={moveRotation} onLostPointerCapture={() => { drag.current = null; }}>
          <div className="pavilion-model" style={{ "--angle": `${angle}deg` } as CSSProperties}>
            <div className="model-face model-front"><div className="model-entry" /><div className="model-window" /></div>
            <div className="model-face model-right"><div className="model-window" /></div>
            <div className="model-face model-back"><div className="model-window" /></div>
            <div className="model-face model-left"><div className="model-window" /></div>
            {roof.id === "rrafshet" ? <div className="model-face model-roof" /> : <>
              <div className="model-face model-gable model-gable-front" />
              <div className="model-face model-gable model-gable-back" />
              <div className="model-face model-slope model-slope-left" />
              <div className="model-face model-slope model-slope-right" />
            </>}
            <div className="model-face model-base" />
          </div>
        </div>
        <div className="pavilion-rotate" aria-label="Rrotullimi i modelit">
          <button type="button" aria-label="Rrotullo majtas" onClick={() => { setAngle((value) => value - 45); clearShare(); }}><ArrowLeft aria-hidden size={18} /></button>
          <button type="button" aria-label="Rikthe këndin fillestar" onClick={() => { setAngle(defaultPavilionAngle); clearShare(); }}><RotateCcw aria-hidden size={16} /></button>
          <button type="button" aria-label="Rrotullo djathtas" onClick={() => { setAngle((value) => value + 45); clearShare(); }}><ArrowRight aria-hidden size={18} /></button>
        </div>
      </div>
      <div className="pavilion-controls">
        <h2 id="pavilion-title">Pavijoni yt.</h2>
        <p>Zgjidh materialin, çatinë dhe dritën. Tërhiq modelin ose përdor shigjetat për ta rrotulluar.</p>
        <fieldset>
          <legend>Materiali</legend>
          <div className="pavilion-options">
            {finishes.map((item) => <label key={item.id}><input type="radio" name="pavilion-finish" value={item.id} checked={finish.id === item.id} onChange={() => { setFinish(item); clearShare(); }} /><span>{item.label}</span></label>)}
          </div>
        </fieldset>
        <fieldset>
          <legend>Çatia</legend>
          <div className="pavilion-options">
            {roofProfiles.map((item) => <label key={item.id}><input type="radio" name="pavilion-roof" value={item.id} checked={roof.id === item.id} onChange={() => { setRoof(item); clearShare(); }} /><span>{item.label}</span></label>)}
          </div>
        </fieldset>
        <fieldset>
          <legend>Drita</legend>
          <div className="pavilion-options">
            {lighting.map((item) => <label key={item.id}><input type="radio" name="pavilion-light" value={item.id} checked={light.id === item.id} onChange={() => { setLight(item); clearShare(); }} /><span>{item.label}</span></label>)}
          </div>
        </fieldset>
        <div className="pavilion-actions">
          <button type="button" className="story-button" onClick={share}><Link2 aria-hidden size={18} /> Kopjo lidhjen</button>
          <Link className="text-link" href={finish.href}>Shiko materialin <ArrowRight aria-hidden size={16} /></Link>
        </div>
        {shareUrl && <div className="pavilion-share">
          <label>Lidhja e pavijonit <input ref={shareField} readOnly type="url" value={shareUrl} onFocus={(event) => event.currentTarget.select()} /></label>
          <p role="status">{copied ? "Lidhja u kopjua." : "Kopjo lidhjen nga fusha më sipër."}</p>
        </div>}
        <p className="pavilion-caption">Model konceptual.</p>
      </div>
    </div>
  </section>;
}
