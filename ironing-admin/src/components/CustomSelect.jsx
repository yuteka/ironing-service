import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ value, onChange, options, placeholder = "Select...", width = 'auto', minWidth = 120 }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div ref={containerRef} style={{ position: 'relative', width, minWidth }}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          width: '100%', 
          padding: '8px 14px', 
          fontSize: '0.85rem', 
          fontWeight: 600, 
          color: '#334155', 
          backgroundColor: 'rgba(255,255,255,0.9)', 
          border: '1px solid #e2e8f0', 
          borderRadius: '10px',
          cursor: 'pointer',
          boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
          transition: 'all 0.2s ease',
          gap: 8
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} style={{ color: '#94a3b8', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div style={{ 
          position: 'absolute', 
          top: 'calc(100% + 6px)', 
          left: 0, 
          width: '100%', 
          minWidth: '100%',
          backgroundColor: '#ffffff', 
          border: '1px solid #e2e8f0', 
          borderRadius: '12px', 
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', 
          zIndex: 9999, 
          maxHeight: 220, 
          overflowY: 'auto',
          padding: '6px'
        }}>
          {options.map((opt) => (
            <div 
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                padding: '8px 12px',
                fontSize: '0.85rem',
                fontWeight: value === opt.value ? 700 : 500,
                color: value === opt.value ? '#0f172a' : '#475569',
                backgroundColor: value === opt.value ? '#f1f5f9' : 'transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'background-color 0.15s',
                marginBottom: 2
              }}
              onMouseEnter={(e) => {
                if (value !== opt.value) e.currentTarget.style.backgroundColor = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                if (value !== opt.value) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span>{opt.label}</span>
              {value === opt.value && <Check size={14} style={{ color: '#3b82f6' }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
