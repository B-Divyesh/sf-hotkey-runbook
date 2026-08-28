# Hotkey Runbook — visual thesis

## Direction: a botanical field guide for operational procedures

An operator should recognize a runbook the way a field researcher recognizes a specimen: by a precise name, a compact description, distinguishing parameters, provenance, and a written handling note. The interface borrows the calm scrutiny of an herbarium sheet—not nostalgia for its own sake. Fine rules indicate sequence, pinned labels establish trust, and safety-red marks appear only at the moment of execution. It should feel collected, local, and reviewable rather than cloudy or magical.

The marketing page is the opened field guide; the desktop app is its working specimen drawer. Chrome recedes. Runbook content and execution state remain obvious within two seconds.

## Palette

All colors are CSS tokens. Light is the default; dark is a night-field treatment rather than an inverted afterthought.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--paper` | `#F3F0E4` | `#171B16` | page/background |
| `--sheet` | `#FCFAF1` | `#20261F` | working surface |
| `--ink` | `#17231C` | `#F0EFE2` | primary text |
| `--muted` | `#536158` | `#AAB6A9` | supporting text |
| `--fern` | `#246142` | `#72C692` | primary action/trust |
| `--fern-deep` | `#143C29` | `#B7E6C6` | headings/active text |
| `--lichen` | `#D9E0C1` | `#344535` | selected surfaces |
| `--clay` | `#A33B2B` | `#FF9B86` | consent/danger only |
| `--amber` | `#8B5A13` | `#F2C36B` | caution/pending |
| `--rule` | `#BBC1AE` | `#4B584B` | borders and guide lines |

Primary text and controls meet WCAG AA; state is always paired with a word or symbol, never color alone.

## Type

- **Headings and specimen numbers:** Georgia, Cambria, `Times New Roman`, serif. The engraved shapes evoke field-guide titles and make runbook names feel authored.
- **Interface, body, and command text:** system UI stack with `ui-monospace` for commands. This stays fast and legible without third-party font requests.
- Scale: 14 label / 16 body / 20 section / 28 utility title / 44–64 marketing display. Body leading is 1.55; prose measure tops out near 68 characters. Numbers use tabular figures.

## Spacing and shape

- 4 px base grid; primary rhythm: 8, 12, 16, 24, 32, 48, 72 px.
- Corners are restrained (4–10 px), like clipped labels rather than bubbly cards.
- 44 px minimum controls with 8 px between targets.
- A subtle 12 px paper grid is CSS-generated and decorative; content grouping relies on proximity first, rules second, and boxed cards only for genuinely independent specimens.
- Mobile stacks the specimen list above the detail sheet and removes the decorative annotation rail. Safe-area padding protects bottom actions.

## Interaction grammar

- `/` or `⌘/Ctrl+K` focuses the runbook filter; arrows move through results; Enter opens; `⌘/Ctrl+Enter` advances to review and then executes only from the explicit review dialog; Escape retreats one layer.
- Selection resembles sliding a specimen sheet forward: a 2 px fern rule and lichen wash.
- Typed parameter fields display their type and validation beside the label. Secret values are never echoed into preview or history.
- Execution has three visually distinct stages: **Prepare → Review exact argv → Hold to run**. The final action names the runbook and is safety-red.
- Every async operation reports loading, success, or a useful recovery instruction in a polite live region.

## Motion

- UI transitions last 160–220 ms and use only opacity/transform. Sheets move from their originating list edge; status stamps settle with a 2 px vertical motion.
- No ambient looping motion. The hero illustration has a single, optional entrance.
- Under `prefers-reduced-motion: reduce`, transforms and smooth scrolling are removed and state changes become instant opacity swaps.

## Original asset plan and provenance

One wide editorial hero illustration shows a pressed fern whose fronds subtly resolve into command branches beside a specimen label and field tools. It explains the core metaphor; the product UI itself remains code-native. App icons and small botanical marks are hand-authored SVG/CSS linework.

### Hero prompt sheet

- **Use case:** `stylized-concept`
- **Asset:** landing-page hero, 3:2 landscape
- **Subject/world:** an open archival botanical field-guide sheet on a workbench; one pressed fern with fronds subtly organized like a command decision tree; a small blank specimen tag, linen thread, brass pin, graphite tick marks
- **Medium/materials:** refined editorial gouache and colored-pencil illustration on warm fibrous paper; crisp cut-paper edges; tactile but uncluttered
- **Composition/lens:** top-down, wide composition, specimen centered right with quiet negative space on the left; no UI screenshot
- **Light:** soft northern-window light; careful, calm, trustworthy
- **Palette words:** bone paper, deep forest ink, fern green, lichen, one tiny clay-red registration mark
- **Negative list:** no text, no legible writing, no letters, no numbers, no logos, no watermark, no people, no hands, no branded devices, no glossy 3D, no neon, no gradients, no fantasy glow

Generated using the factory Azure image model (`factory-image`) on 2026-08-28 through `/opt/fleet/lib/gen-image.sh`. The selected output is original generated imagery for this product. Source PNG and prompt sidecar live in `assets/src/`; optimized WebP/AVIF derivatives ship with the site. The footer discloses AI-assisted artwork.

## Why it fits

Runbooks are living specimens: collected locally, named precisely, inspected before handling, and annotated after use. The metaphor reinforces provenance and caution without pretending execution is effortless or invisible. It is deliberately unlike a generic dark command palette or gradient SaaS landing page.
