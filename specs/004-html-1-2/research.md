# Phase 0 Research: Color Selection UI

## Decisions
- Use the browser-native `<input type="color">` as the primary color picker.
- Provide two presets: Black (`#000000`) and Red (`#FF0000`).
- Allow direct input of CSS named colors (e.g., `green`, `royalblue`).
- Normalize all colors to hex `#RRGGBB`, then convert to pdf-lib `rgb(r,g,b)` where each channel is 0..1.
- Fallback color on invalid input: Black (`#000000`).

## Rationale
- Native color input offers consistent UX and zero additional dependencies.
- Most modern browsers (including Chromium in CI) support `<input type="color">`.
- Keeping dependencies minimal aligns with project simplicity and CI stability.

## Alternatives Considered
- iro.js (MIT) and Pickr (MIT) as OSS pickers. Rejected for now to avoid extra scripts; could be adopted if a target browser lacks native support.

## Validation/Parsing Approach
- Hex: accept `#RGB`, `#RRGGBB` (expand `#RGB` to `#RRGGBB`).
- CSS named color: set a temporary element style and read back computed value to confirm browser acceptance; if accepted, convert to `#RRGGBB`.
- Any failure → fallback to Black.

## Accessibility Notes
- Label all inputs. Ensure presets and picker are keyboard accessible.
- Provide a small swatch preview with `aria-label` and text description of the selected color value.

