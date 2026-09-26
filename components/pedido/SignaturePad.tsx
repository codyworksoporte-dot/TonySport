'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import './editor.css';

export default function SignaturePad({ value, onChange, label = 'Firma del responsable', reset, disabled = false }: { value: string; onChange: (value: string) => void; label?: string; reset?: number | string | boolean; disabled?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const valueRef = useRef(value);
  const [hasStroke, setHasStroke] = useState(Boolean(value));
  const [error, setError] = useState('');
  const [keyboardCursor, setKeyboardCursor] = useState({ x: 20, y: 50, active: false });
  const [penDown, setPenDown] = useState(false);
  const keyboardInk = useRef(false);
  const previousReset = useRef(reset);
  valueRef.current = value;
  const redraw = useCallback((saved: string) => {
    const canvas = canvasRef.current; const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!saved) return;
    const img = new Image(); img.onload = () => { if (valueRef.current === saved) ctx.drawImage(img, 0, 0, canvas.width, canvas.height); }; img.src = saved;
  }, []);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const observer = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width === Math.round(rect.width * ratio) && canvas.height === Math.round(rect.height * ratio)) return;
      canvas.width = Math.max(1, Math.round(rect.width * ratio)); canvas.height = Math.max(1, Math.round(rect.height * ratio));
      redraw(valueRef.current);
    }); observer.observe(canvas); return () => observer.disconnect();
  }, [redraw]);
  useEffect(() => { if (!drawing.current) redraw(value); setHasStroke(Boolean(value)); }, [value, redraw]);
  useEffect(() => { if (previousReset.current !== reset) { previousReset.current = reset; onChange(''); setHasStroke(false); redraw(''); } }, [reset, onChange, redraw]);
  const point = (event: PointerEvent<HTMLCanvasElement>) => { const canvas = event.currentTarget; const r = canvas.getBoundingClientRect(); return { x: (event.clientX - r.left) * canvas.width / r.width, y: (event.clientY - r.top) * canvas.height / r.height }; };
  const end = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return; drawing.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const png = event.currentTarget.toDataURL('image/png'); valueRef.current = png; onChange(png); setHasStroke(true);
  };
  function finishKeyboard() {
    setPenDown(false);
    if (keyboardInk.current && canvasRef.current) { const png = canvasRef.current.toDataURL('image/png'); valueRef.current = png; onChange(png); setHasStroke(true); keyboardInk.current = false; }
  }
  return <div className="pedido-signature">
    <div className="pedido-editor-heading"><span id="pedido-signature-label">{label}</span><button type="button" className="pedido-tool-button" disabled={disabled || !hasStroke} onClick={() => { onChange(''); valueRef.current = ''; redraw(''); setHasStroke(false); keyboardInk.current = false; setPenDown(false); }}>Borrar firma</button></div>
    <div className="pedido-signature-surface"><canvas id="pedido-signature-canvas" ref={canvasRef} className="pedido-signature-canvas" tabIndex={disabled ? -1 : 0} role="application" aria-labelledby="pedido-signature-label" aria-describedby="pedido-signature-keyboard-help" aria-disabled={disabled} onKeyDown={event => {
      if (disabled) return;
      const moves: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (event.key === ' ') { event.preventDefault(); if (event.repeat) return; setKeyboardCursor(point => ({ ...point, active: true })); if (penDown) finishKeyboard(); else setPenDown(true); return; }
      if (event.key === 'Escape') { finishKeyboard(); setKeyboardCursor(point => ({ ...point, active: false })); return; }
      if (!moves[event.key]) return;
      event.preventDefault(); const canvas = event.currentTarget, ctx = canvas.getContext('2d');
      const step = event.shiftKey ? 4 : 1, [dx, dy] = moves[event.key];
      const next = { x: Math.max(1, Math.min(99, keyboardCursor.x + dx * step)), y: Math.max(1, Math.min(99, keyboardCursor.y + dy * step)), active: true };
      if (penDown && ctx) { const ratio = canvas.width / canvas.getBoundingClientRect().width; ctx.strokeStyle = '#152018'; ctx.lineWidth = 2.4 * ratio; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(keyboardCursor.x * canvas.width / 100, keyboardCursor.y * canvas.height / 100); ctx.lineTo(next.x * canvas.width / 100, next.y * canvas.height / 100); ctx.stroke(); keyboardInk.current = true; }
      setKeyboardCursor(next);
    }} onBlur={() => { finishKeyboard(); setKeyboardCursor(point => ({ ...point, active: false })); }} onPointerDown={event => {
      if (disabled || event.button !== 0 || !event.isPrimary) return; const ctx = event.currentTarget.getContext('2d'); if (!ctx) { setError('No pudimos iniciar la firma. Recarga la página e inténtalo de nuevo.'); return; }
      finishKeyboard(); setKeyboardCursor(point => ({ ...point, active: false }));
      event.currentTarget.setPointerCapture(event.pointerId); drawing.current = true; last.current = point(event); const ratio = event.currentTarget.width / event.currentTarget.getBoundingClientRect().width;
      ctx.fillStyle = '#152018'; ctx.beginPath(); ctx.arc(last.current.x, last.current.y, 1.5 * ratio, 0, Math.PI * 2); ctx.fill();
    }} onPointerMove={event => {
      if (!drawing.current) return; const ctx = event.currentTarget.getContext('2d'); if (!ctx) return; const next = point(event); const ratio = event.currentTarget.width / event.currentTarget.getBoundingClientRect().width;
      ctx.strokeStyle = '#152018'; ctx.lineWidth = 2.4 * ratio; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(next.x, next.y); ctx.stroke(); last.current = next;
    }} onPointerUp={end} onPointerCancel={end} />{keyboardCursor.active && <span className={`pedido-signature-cursor${penDown ? ' is-drawing' : ''}`} style={{ left: `${keyboardCursor.x}%`, top: `${keyboardCursor.y}%` }} aria-hidden="true" />}</div>
    <p id="pedido-signature-keyboard-help" className="pedido-editor-note">Con teclado: entra al recuadro con Tab. Espacio baja o levanta el lápiz; las flechas lo mueven. Mayús + flechas aumenta el recorrido. Levanta el lápiz para guardar cada trazo.</p>
    {keyboardCursor.active && <p className="pedido-signature-keyboard-status" role="status">{penDown ? 'Lápiz abajo: las flechas dibujan.' : 'Lápiz arriba: las flechas mueven el cursor.'}</p>}
    <p className="pedido-editor-note" role="status">{hasStroke ? 'Firma capturada. Puedes borrarla y volver a firmar.' : 'Firma dentro del recuadro con el dedo o el cursor.'}</p>
    {error && <p className="pedido-editor-message is-error" role="alert">{error}</p>}
  </div>;
}
