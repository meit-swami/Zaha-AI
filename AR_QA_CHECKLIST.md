# AR QA Checklist

## Performance Budgets
- Eyewear mode steady state FPS: `>= 24`
- Apparel mode steady state FPS: `>= 20`
- Watch mode steady state FPS: `>= 22`
- Initial model load on desktop broadband: `< 5s`
- Initial model load on mid-tier mobile: `< 8s`

## Functional Checks
- Product selected in catalog must match live overlay asset label.
- Zoom out must reach `0.6x`; zoom in must reach `2.2x`.
- Guided scan progress reaches 100% under stable full-body framing.
- Watch anchor remains attached to wrist center when rotating hand.
- Eyewear temples remain near ear region in side profile.

## Device Matrix
- Chrome latest (Windows)
- Edge latest (Windows)
- Chrome latest (Android)
- Safari latest (iOS)

## Telemetry Verification
- `window.__ZAHA_AR_TELEMETRY__()` returns events array.
- Events expected: `ar_init_ready`, `zoom_change`, `view_mode_change`, lock events (`face_lock` / `body_lock` / `hand_lock`), and `guided_scan_complete` when used.
