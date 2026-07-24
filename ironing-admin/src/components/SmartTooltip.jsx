import React, { useRef, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * SmartTooltip — Shows a stylish tooltip ONLY when text is visually truncated (...)
 * Rendered via React Portal to prevent overflow clipping and absolute parent positioning bugs.
 */
export default function SmartTooltip({ text, style = {}, className = '', icon = null }) {
  const textRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const checkAndShow = useCallback(() => {
    const el = textRef.current;
    if (!el) return;
    // Only show tooltip if content is actually overflowing (truncated)
    if (el.scrollWidth > el.clientWidth) {
      const rect = el.getBoundingClientRect();
      setCoords({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
      setShowTooltip(true);
    }
  }, []);

  const hide = useCallback(() => setShowTooltip(false), []);

  useEffect(() => {
    if (showTooltip) {
      window.addEventListener('scroll', hide, { passive: true });
      return () => window.removeEventListener('scroll', hide);
    }
  }, [showTooltip, hide]);

  if (!text) return <span className="text-slate-400">-</span>;

  return (
    <>
      <span
        ref={textRef}
        className={`truncate block cursor-default ${className}`}
        style={style}
        onMouseEnter={checkAndShow}
        onMouseLeave={hide}
      >
        {icon && <span className="mr-1 inline-block align-middle">{icon}</span>}
        {text}
      </span>

      {showTooltip && createPortal(
        <div
          className="fixed z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: coords.x,
            top: coords.y - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {/* Arrow */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-slate-900" />
          {/* Bubble */}
          <div className="bg-slate-900/95 border border-slate-700/50 rounded-xl px-3 py-1.5 text-white text-xs font-bold whitespace-normal break-words max-w-xs shadow-xl text-center leading-snug">
            {text}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
