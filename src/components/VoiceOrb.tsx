import { useEffect, useRef, useState } from "react";
import type React from "react";
import { useNavigate } from "@tanstack/react-router";
import { AudioLines, X } from "lucide-react";
import { AppOrbit } from "./AppOrbit";

const HOLD_MS = 1000;

/** Single Aura button: tap = voice (Aura home), hold 1 s = orbit of every lab app. */
export function VoiceOrb() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const swipeX = useRef<number | null>(null);
  const dragX = useRef<number | null>(null);
  const start = useRef<number | null>(null);
  const held = useRef(false);
  const raf = useRef(0);
  const talk = () => void navigate({ to: "/", search: { voice: false } });

  useEffect(() => {
    window.addEventListener("aura-talk", talk);
    return () => window.removeEventListener("aura-talk", talk);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  useEffect(() => {
    if (!shown) return;
    const out = (e: PointerEvent) => { if (!(e.target as HTMLElement).closest?.('.aura-standalone-button')) setShown(false); };
    window.addEventListener('pointerdown', out);
    return () => window.removeEventListener('pointerdown', out);
  }, [shown]);

  function cancel() { start.current = null; cancelAnimationFrame(raf.current); setProgress(0); }
  function down(e: React.PointerEvent) {
    dragX.current = e.clientX;
    held.current = false;
    start.current = performance.now();
    const tick = () => {
      if (start.current == null) return;
      const p = Math.min(1, (performance.now() - start.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) { held.current = true; cancel(); navigator.vibrate?.(30); setOpen(true); return; }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }
  function move(e: React.PointerEvent) {
    if (dragX.current != null && e.clientX - dragX.current > 30) { dragX.current = null; held.current = true; cancel(); setShown(false); }
  }
  function up() {
    dragX.current = null;
    const wasHold = held.current;
    cancel();
    if (!wasHold) talk();
  }

  const C = 2 * Math.PI * 36;
  const size = typeof window !== "undefined" ? Math.min(520, window.innerWidth - 40, window.innerHeight - 60) : 480;
  return (
    <>
      {!shown && <div className="aura-swipe-zone" aria-hidden="true"
        onPointerDown={(e) => { swipeX.current = e.clientX; }}
        onPointerMove={(e) => { if (swipeX.current != null && swipeX.current - e.clientX > 30) { swipeX.current = null; setShown(true); } }}
        onPointerUp={() => { swipeX.current = null; }}
        onPointerCancel={() => { swipeX.current = null; }} />}
      <button
        data-shown={shown}
        type="button"
        aria-label="Parler à Aura (maintenir 1 seconde pour changer d'application)"
        title="Clic : parler à Aura · Maintenir : applications"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); talk(); } }}
        className="aura-standalone-button inline-flex select-none items-center justify-center"
        style={{ touchAction: "none" }}
      >
        <AudioLines />
        {progress > 0.05 && (
          <svg className="pointer-events-none absolute -rotate-90" style={{ inset: -10 }} viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - progress)} />
          </svg>
        )}
      </button>
      {open && (
        <div className="sky-switch-overlay fixed inset-0 z-[9999] flex items-center justify-center" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="relative">
            <AppOrbit size={size} onPick={() => setOpen(false)} />
            <button type="button" aria-label="Fermer" onClick={() => setOpen(false)}
              className="sky-switch-trigger absolute left-1/2 top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full">
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
