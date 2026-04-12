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
        height: 32,
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #333',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
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
            gap: 4,
            padding: '0 12px',
            height: '100%',
            cursor: 'pointer',
            backgroundColor: tab.id === activeTabId ? '#2a2a2a' : 'transparent',
            color: tab.id === activeTabId ? '#fff' : '#888',
            borderRight: '1px solid #333',
            userSelect: 'none',
            maxWidth: 160,
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
                color: '#666',
                fontSize: 14,
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
          color: '#666',
          cursor: 'pointer',
          padding: '0 8px',
          height: '100%',
          fontSize: 16,
        }}
        title="New document"
      >
        +
      </button>
    </div>
  );
}
