# Data Model

## Entities

### FormInput
Represents the user's selection from the web form.

| Field       | Type   | Description                          |
|-------------|--------|--------------------------------------|
| `selection` | String | The value of the selected radio button. |

**Validation Rules**:
- Must be one of the predefined values from the radio button group (e.g., "draw", "no-draw").

### PdfCircle
Represents the circle to be drawn on the PDF.

| Field    | Type   | Description                                  |
|----------|--------|----------------------------------------------|
| `x`      | Number | The x-coordinate of the center of the circle. |
| `y`      | Number | The y-coordinate of the center of the circle. |
| `radius` | Number | The radius of the circle.                    |
| `color`  | String | The color of the circle (e.g., "black").      |

**State Transitions**:
- The `PdfCircle` is only created and drawn if `FormInput.selection` matches the specific value designated to trigger the drawing action.