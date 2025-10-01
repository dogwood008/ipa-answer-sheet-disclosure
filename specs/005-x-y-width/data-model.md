# Data Model

## Entities

### RectangleDimensions
Represents the dimensions and position of the rectangle to be drawn on the PDF.

| Field    | Type   | Description                                  |
|----------|--------|----------------------------------------------|
| `x`      | Number | The x-coordinate of the top-left corner.     |
| `y`      | Number | The y-coordinate of the top-left corner.     |
| `width`  | Number | The width of the rectangle.                  |
| `height` | Number | The height of the rectangle.                 |

**Validation Rules**:
- All fields must be valid numbers.
- `width` and `height` must be positive.