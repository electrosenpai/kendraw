# Accessibility — Kendraw v0.1.0

## Current Status

Kendraw is a canvas-based chemistry drawing application. Canvas content is inherently non-accessible to screen readers. We mitigate this through:

### Implemented (v0.1.0)

- **Keyboard navigation**: All tools accessible via keyboard shortcuts (V/A/E/H)
- **Shortcut cheatsheet**: Press `?` to view all keyboard shortcuts
- **Focus management**: Tab bar and tool palette are keyboard-navigable
- **Semantic HTML**: Non-canvas UI uses proper heading hierarchy and button elements
- **Color contrast**: Design tokens ensure WCAG AA contrast ratios for UI text

### Planned (post-v0.1.0)

- **ARIA labels** on tool buttons and panels
- **Screen reader announcements** for state changes (atom added, undo, etc.)
- **High contrast mode** support
- **axe-core** automated testing in Playwright CI
- **Canvas text alternatives**: `aria-label` on canvas element with molecule description

## Testing

Accessibility testing uses:

- Manual keyboard-only testing
- axe-core integration (Playwright, planned)
- Chrome Lighthouse audits
