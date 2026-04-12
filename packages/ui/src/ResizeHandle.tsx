import { useRef, useCallback, useState } from 'react';

interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  onDoubleClick: () => void;
}

export function ResizeHandle({ direction, onResize, onDoubleClick }: ResizeHandleProps) {
  const [active, setActive] = useState(false);
  const [hovered, setHovered] = useState(false);
  const startRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setActive(true);
      startRef.current = direction === 'horizontal' ? e.clientX : e.clientY;

      const handleMove = (me: MouseEvent) => {
        const current = direction === 'horizontal' ? me.clientX : me.clientY;
        const delta = current - startRef.current;
        if (Math.abs(delta) > 1) {
          onResize(delta);
          startRef.current = current;
        }
      };

      const handleUp = () => {
        setActive(false);
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [direction, onResize],
  );

  const isH = direction === 'horizontal';

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        [isH ? 'right' : 'bottom']: -3,
        [isH ? 'top' : 'left']: 0,
        [isH ? 'width' : 'height']: 6,
        [isH ? 'height' : 'width']: '100%',
        cursor: isH ? 'col-resize' : 'row-resize',
        zIndex: 30,
        background: active || hovered ? 'var(--kd-color-accent)' : 'transparent',
        opacity: active ? 0.6 : hovered ? 0.3 : 0,
        transition: 'opacity 150ms ease',
      }}
    />
  );
}
