import { useState, useEffect, useRef } from 'react';

export default function Dropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const select = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div className="custom-dropdown" ref={ref}>
      <button
        type="button"
        className="custom-dropdown-trigger"
        onClick={() => setOpen((o) => !o)}
      >
        {selected.label}
        <span className="custom-dropdown-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <ul className="custom-dropdown-menu">
          {options.map((o) => (
            <li
              key={o.value}
              className={`custom-dropdown-item${o.value === value ? ' selected' : ''}`}
              onMouseDown={() => select(o.value)}
              onTouchEnd={() => select(o.value)}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
