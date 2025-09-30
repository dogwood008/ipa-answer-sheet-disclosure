# Data Model: Color Selection

## Entities

### ColorSelection
- method: `preset` | `picker` | `name`
- value: string (input value; hex or name)
- normalizedHex: string (e.g., `#RRGGBB`)
- valid: boolean

## Invariants
- The selected color is applied to both the text and the circle.
- On invalid input, `normalizedHex` becomes `#000000` and `valid=false`.

## Derived Values
- pdfColor: `rgb(r,g,b)` where `r=g=b=0..1` derived from `normalizedHex` for pdf-lib.

## State Transitions
1. initial → preset(selected)
2. any → picker(color)
3. any → name(input)
4. any invalid → fallback to black

