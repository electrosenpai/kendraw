import { useState, useRef, useEffect, useCallback } from 'react';
import type { TabInfo } from './workspace-store';

interface TabBarProps {
  tabs: TabInfo[];
  activeTabId: string | null;
  onSwitchTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  onRenameTab?: ((id: string, name: string) => void) | undefined;
  theme?: 'dark' | 'light' | undefined;
  onToggleTheme?: (() => void) | undefined;
}

export function TabBar({
  tabs,
  activeTabId,
  onSwitchTab,
  onCloseTab,
  onNewTab,
  onRenameTab,
  theme,
  onToggleTheme,
}: TabBarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const startEditing = useCallback((tab: TabInfo) => {
    setEditingId(tab.id);
    setEditValue(tab.title || 'Untitled');
  }, []);

  const commitRename = useCallback(() => {
    if (editingId && editValue.trim()) {
      const sanitized = editValue.trim().replace(/[<>:"/\\|?*]/g, '_');
      onRenameTab?.(editingId, sanitized);
    }
    setEditingId(null);
  }, [editingId, editValue, onRenameTab]);

  const cancelRename = useCallback(() => {
    setEditingId(null);
  }, []);

  return (
    <div style={barStyle}>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onSwitchTab(tab.id)}
          onDoubleClick={() => startEditing(tab)}
          style={{
            ...tabStyle,
            backgroundColor:
              tab.id === activeTabId ? 'var(--kd-color-surface-hover)' : 'transparent',
            color:
              tab.id === activeTabId
                ? 'var(--kd-color-text-primary)'
                : 'var(--kd-color-text-muted)',
          }}
        >
          {editingId === tab.id ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') cancelRename();
                e.stopPropagation();
              }}
              onBlur={commitRename}
              onClick={(e) => e.stopPropagation()}
              style={inputStyle}
            />
          ) : (
            <span style={labelStyle}>{tab.title || 'Untitled'}</span>
          )}
          {tabs.length > 1 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
              style={closeBtnStyle}
            >
              x
            </span>
          )}
        </div>
      ))}
      <button onClick={onNewTab} style={newBtnStyle} title="New document (Ctrl+N)">
        +
      </button>
      {onToggleTheme && (
        <button
          onClick={onToggleTheme}
          data-testid="theme-toggle"
          aria-label={theme === 'light' ? 'Switch to dark canvas' : 'Switch to light canvas'}
          title={theme === 'light' ? 'Switch to dark canvas' : 'Switch to light canvas'}
          style={{ ...newBtnStyle, marginLeft: 'auto', fontSize: 'var(--kd-font-size-md)' }}
        >
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      )}
    </div>
  );
}

const barStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '100%',
  backgroundColor: 'var(--kd-color-bg-tertiary)',
  borderBottom: '1px solid var(--kd-color-border)',
  fontSize: 'var(--kd-font-size-sm)',
  overflow: 'hidden',
};

const tabStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--kd-space-sm)',
  padding: '0 var(--kd-space-lg)',
  height: '100%',
  cursor: 'pointer',
  borderRight: '1px solid var(--kd-color-border-subtle)',
  userSelect: 'none',
  maxWidth: 180,
  transition: 'background var(--kd-transition-fast)',
};

const labelStyle: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1,
};

const inputStyle: React.CSSProperties = {
  width: 100,
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--kd-color-accent)',
  color: 'var(--kd-color-text-primary)',
  fontSize: 'inherit',
  fontFamily: 'inherit',
  padding: '0 2px',
  outline: 'none',
};

const closeBtnStyle: React.CSSProperties = {
  cursor: 'pointer',
  color: 'var(--kd-color-text-muted)',
  fontSize: 'var(--kd-font-size-md)',
  lineHeight: 1,
};

const newBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--kd-color-text-muted)',
  cursor: 'pointer',
  padding: '0 var(--kd-space-md)',
  height: '100%',
  fontSize: 'var(--kd-font-size-lg)',
};
