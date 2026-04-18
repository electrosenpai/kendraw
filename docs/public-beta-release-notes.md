# Kendraw — Public Beta Release Notes (Draft)

**Status** — Draft, gated on the four pre-launch conditions in `docs/nmr-scientific-review-v7.md` §V.2 (README honesty pass, observability stack, audit-log viewer, feedback channel).

**Date target** — 2026-05-02 (post wave-8)

---

## Pitch

> **Open-source chemistry sketcher with NMR built in.** MIT-licensed, runs in your browser, free forever. Public beta.

---

## Five forces to put forward

1. **Free and self-hostable.** No license server, no per-seat fee. One `docker compose up` and you have your own instance with HTTPS via Traefik + Let's Encrypt. Privacy-first: your structures never leave your machine.
2. **NMR prediction with the math right.** DEPT-135 / DEPT-90 with correct phase, multiplet rendering with J-coupling, JCAMP-DX import for spectrum overlay, frequency selector. Built on RDKit + a published NMR engine, with ppm uncertainty (`σ_ppm`) reported alongside every shift.
3. **ChemDraw-compatible round-trip.** CDXML writer with parse round-trip means you can move structures between Kendraw and ChemDraw without losing connectivity. Useful if your lab is mid-migration.
4. **Web-native UX.** 2-column grouped toolbox with ChemDraw-style hotkeys (b for bond, e for erase, ring shortcuts, atom labels). Dark mode for projector use. Searchable shortcut cheatsheet. Keyboard-first interaction.
5. **Audit primitives for regulated workflows.** Append-only audit trail with SHA-256 hash chain, e-signature modal with reason-for-change. **Beta — see limitations below.**

---

## Three limitations to mention honestly

1. **Pharma-compliance is experimental.** The audit trail and e-signature modal are real primitives, but the audit-log viewer is shipping in V8 and on-disk persistence is still maturing. Kendraw is **not** a substitute for a 21 CFR Part 11–validated ELN today. Validation package (IQ/OQ/PQ, GAMP-5 cat 4) is on the roadmap.
2. **Multi-step schemes are bounded.** The new canvas is great for single-page structures and short reaction sequences. If you draw 30-step total syntheses with page breaks, Kendraw is not yet your tool — multi-page document support is wave-9.
3. **The new canvas is the default but the old one is one toggle away.** A few legacy tools (resolved-multiplet rendering, some stereochemistry micro-geometry) are still polish items. Bug reports welcome.

---

## Disclaimer

Kendraw is in **public beta**. It is suitable for academic teaching, individual chemist sketching, and exploratory NMR work. It is **not yet validated** for FDA-submission documentation, GxP-regulated lab notebooks, or patent-grade chemical drawing. The team is actively shipping the gaps; see `docs/nmr-scientific-review-v7.md` and `docs/wave-8-plan.md` for transparency on what's done and what's next.

---

## Where to give feedback

- **Issues / feature requests** — GitHub Discussions: <link to be added at launch>
- **Bug reports** — GitHub Issues: <link to be added at launch>
- **Questions** — `/feedback` endpoint in the app footer

---

## Credits

Kendraw is authored by Jean-Baptiste DONNETTE. Built on RDKit, FastAPI, React, Vite, and many open-source shoulders. Scientific review board: Pr. Duval (Saclay), Dr. Marcos (MIT), Pr. Yamamoto (Kyoto), Dr. Chen (Stanford), Dr. Park (ex-PerkinElmer ChemDraw), Pr. Al-Rashid (pharma/FDA), Marina Volkov (M2 Moscow State), Thomas Weber (admin IT, Novartis).
