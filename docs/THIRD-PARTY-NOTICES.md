# Third-party notices

Kendraw is an independent project. The codebase is MIT-licensed and contains
no third-party source code. This file credits upstream projects whose
**designs, algorithms, or visual conventions** inspired parts of Kendraw.
Each file that takes inspiration from an upstream carries an attribution
comment pointing to the original repository.

## Ketcher — EPAM Systems

- **Project.** Ketcher — web-based 2D chemical structure editor
- **Upstream.** https://github.com/epam/ketcher
- **License.** Apache 2.0
- **Copyright.** © 2010-2025 EPAM Systems

### Relationship

Ketcher is Kendraw's design reference for the wave-4 canvas and toolbox
overhaul. The Kendraw implementation is **clean-room**: we read Ketcher's
public sources to understand the shape of well-known drawing-tool ergonomics
(tool abstraction, pointer dispatch lifecycle, rubber-band marquee, 15° angle
snap, quick-edit panel) and then re-implemented equivalent behaviour from
scratch in TypeScript against Kendraw's own scene/renderer packages.

No Ketcher source code has been copied, transformed, or machine-translated
into Kendraw. Algorithms and public APIs are not subject to copyright in
the jurisdictions where Kendraw is developed; visual layouts and user-facing
interactions were re-designed independently while drawing on the same body
of chemistry-editor conventions that Ketcher and ChemDraw also share.

### Files that reference Ketcher

Every file in `packages/ui/src/canvas-new/` that mirrors a Ketcher design
choice opens with the attribution header:

```
// Design inspired by Ketcher (EPAM Systems, Apache 2.0)
// Original: https://github.com/epam/ketcher
// Reimplemented from scratch for Kendraw.
```

### Apache 2.0 compatibility

The Apache 2.0 licence permits design inspiration and algorithm study without
obligation, and is compatible with Kendraw's MIT licence. Kendraw ships no
Ketcher artefacts — no binaries, no SVG icons, no strings, no type
definitions. The attribution above exists as a courtesy and to make the
design lineage auditable for downstream users.

## Other upstream credits

See the `package.json` dependency tree for the full list of libraries
bundled at runtime; each carries its own licence file inside
`node_modules/`.
