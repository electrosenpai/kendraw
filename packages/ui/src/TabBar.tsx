import type { TabInfo } from './workspace-store';

interface TabBarProps {
  tabs: TabInfo[];
  activeTabId: string | null;
  onSwitchTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
}

export function TabBar({ tabs, activeTabId, onSwitchTab, onCloseTab, onNewTab }: TabBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 'var(--kd-tabbar-height)',
        backgroundColor: 'var(--kd-color-bg-tertiary)',
        borderBottom: '1px solid var(--kd-color-border)',
        fontSize: 'var(--kd-font-size-sm)',
        overflow: 'hidden',
      }}
    >
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onSwitchTab(tab.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--kd-space-sm)',
            padding: '0 var(--kd-space-lg)',
            height: '100%',
            cursor: 'pointer',
            backgroundColor:
              tab.id === activeTabId ? 'var(--kd-color-surface-hover)' : 'transparent',
            color:
              tab.id === activeTabId
                ? 'var(--kd-color-text-primary)'
                : 'var(--kd-color-text-muted)',
            borderRight: '1px solid var(--kd-color-border-subtle)',
            userSelect: 'none',
            maxWidth: 160,
            transition: 'background var(--kd-transition-fast)',
          }}
        >
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {tab.title || 'Untitled'}
          </span>
          {tabs.length > 1 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
              style={{
                cursor: 'pointer',
                color: 'var(--kd-color-text-muted)',
                fontSize: 'var(--kd-font-size-md)',
                lineHeight: 1,
              }}
            >
              x
            </span>
          )}
        </div>
      ))}
      <button
        onClick={onNewTab}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--kd-color-text-muted)',
          cursor: 'pointer',
          padding: '0 var(--kd-space-md)',
          height: '100%',
          fontSize: 'var(--kd-font-size-lg)',
        }}
        title="New document (Ctrl+N)"
      >
        +
      </button>
    </div>
  );
}
