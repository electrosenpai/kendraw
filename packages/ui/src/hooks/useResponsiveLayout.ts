import { useState, useEffect } from 'react';

export type LayoutMode = 'comfort' | 'compact' | 'minimal';

export function useResponsiveLayout(): LayoutMode {
  const [layout, setLayout] = useState<LayoutMode>('comfort');

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1440) setLayout('comfort');
      else if (w >= 1024) setLayout('compact');
      else setLayout('minimal');
    };
    window.addEventListener('resize', update);
    update();
    return () => window.removeEventListener('resize', update);
  }, []);

  return layout;
}
