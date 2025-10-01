# Feature Specification: Draw Rectangle

**Feature Branch**: `005-x-y-width`
**Created**: 2025-09-28
**Status**: Draft
**Input**: User description: "矩形を描けるようにしてください。始点のx, y座標とwidth, heightを与えたら、指定の色で描画してください。"

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a user, I want to draw a rectangle on the PDF by specifying its dimensions (x, y, width, height) and color, so that I can add custom rectangular shapes to the document.

### Acceptance Scenarios
1.  **Given** I have entered numeric values for x, y, width, and height, **When** I trigger PDF generation, **Then** a rectangle with the specified dimensions and the currently selected color is drawn on the PDF.
2.  **Given** a rectangle is drawn on the PDF, **When** I change the color and regenerate the PDF, **Then** the rectangle is drawn with the new color.

### Edge Cases
- If non-numeric values are entered for the rectangle's dimensions, the system MUST NOT draw a rectangle and MUST NOT throw an error.
- If the specified dimensions cause the rectangle to exceed the page boundaries, the rectangle MUST be clipped at the page edge.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: The system MUST provide four input fields on the HTML page for the user to specify the rectangle's starting x-coordinate, y-coordinate, width, and height.
- **FR-002**: The system MUST use the currently selected color (from the existing color selection feature) to draw the rectangle.
- **FR-003**: The system MUST draw a solid-filled rectangle based on the user-provided dimensions when the PDF is generated.
- **FR-004**: The system MUST handle non-numeric or empty input for dimension fields gracefully by not attempting to draw the rectangle.

### Key Entities *(include if feature involves data)*
- **RectangleDimensions**:
    - `x`: The x-coordinate of the top-left corner.
    - `y`: The y-coordinate of the top-left corner.
    - `width`: The width of the rectangle.
    - `height`: The height of the rectangle.

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [X] No implementation details (languages, frameworks, APIs)
- [X] Focused on user value and business needs
- [X] Written for non-technical stakeholders
- [X] All mandatory sections completed

### Requirement Completeness
- [X] No [NEEDS CLARIFICATION] markers remain
- [X] Requirements are testable and unambiguous
- [X] Success criteria are measurable
- [X] Scope is clearly bounded
- [X] Dependencies and assumptions identified