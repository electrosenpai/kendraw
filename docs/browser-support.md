# Browser Support — Kendraw v0.1.0

## Supported Browsers

| Browser  | Version | Status    |
| -------- | ------- | --------- |
| Chromium | 120+    | Primary   |
| Firefox  | 120+    | Supported |
| WebKit   | 17+     | Supported |
| Edge     | 120+    | Supported |

## Known Limitations

- **Safari IndexedDB**: Large documents (>50MB) may hit storage quotas. Kendraw uses chunk-based persistence to mitigate.
- **Firefox Canvas**: Some anti-aliasing differences in bond rendering. Visual only, no functional impact.
- **WebKit WASM**: RDKit.js cold start may be slower (~1.5s vs ~0.8s on Chromium). Mitigated by lazy loading in Web Worker.

## Testing Matrix

Cross-browser testing is performed via Playwright with Chromium, Firefox, and WebKit engines.
