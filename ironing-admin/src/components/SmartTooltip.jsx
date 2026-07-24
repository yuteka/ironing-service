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

  if (!text) return <span style={{ color: '#94a3b8' }}>-</span>;

  return (
    <>
      <span
        ref={textRef}
        className={className}
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'block',
          cursor: 'default',
          ...style,
        }}
        onMouseEnter={checkAndShow}
        onMouseLeave={hide}
      >
        {icon && <span style={{ marginRight: 4, verticalAlign: 'middle', display: 'inline-block' }}>{icon}</span>}
        {text}
      </span>

      {showTooltip && createPortal(
        <div
          style={{
            position: 'fixed',
            left: coords.x,
            top: coords.y - 8,
            transform: 'translate(-50%, -100%)',
            zIndex: 99999,
            pointerEvents: 'none',
            animation: 'tooltipFadeIn 0.12s ease-out',
          }}
        >
          <style>{`
            @keyframes tooltipFadeIn {
              from { opacity: 0; transform: translate(-50%, -95%); }
              to   { opacity: 1; transform: translate(-50%, -100%); }
            }
          `}</style>
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            bottom: -6,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid rgba(15,23,42,0.95)',
          }} />
          {/* Bubble */}
          <div style={{
            background: 'rgba(15,23,42,0.95)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            padding: '6px 12px',
            color: '#ffffff',
            fontSize: '0.75rem',
            fontWeight: 600,
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            width: 'max-content',
            maxWidth: 260,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            letterSpacing: '0.01em',
            lineHeight: 1.3,
            textAlign: 'center',
          }}>
            {text}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
