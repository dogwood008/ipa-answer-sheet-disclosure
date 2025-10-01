# Data Model

## Entities

### UserInput
Represents the data entered by the user in the form.

| Field        | Type   | Description              |
|--------------|--------|--------------------------|
| `name`       | String | The user's full name.    |
| `examNumber` | String | The user's exam number.  |
| ...          | ...    | Other fields as needed.  |

**Validation Rules**:
- `name` must not be empty.
- `examNumber` must be a specific format (e.g., 8 digits).

### FieldMap
A configuration object that maps `UserInput` fields to their corresponding coordinates and properties on the PDF template.

| Field       | Type   | Description                                      |
|-------------|--------|--------------------------------------------------|
| `[key]`     | Object | A key matching a field in `UserInput`.           |
| `[key].x`   | Number | The x-coordinate for drawing the field's value.  |
| `[key].y`   | Number | The y-coordinate for drawing the field's value.  |
| `[key].font`| String | (Optional) The font to use for this field.       |
| `[key].size`| Number | (Optional) The font size for this field.         |

This data model will be represented as TypeScript interfaces in the application.
```typescript
interface UserInput {
  name: string;
  examNumber: string;
  // ... other fields
}

interface FieldConfig {
  x: number;
  y: number;
  font?: string;
  size?: number;
}

type FieldMap = {
  [key in keyof UserInput]: FieldConfig;
};
```