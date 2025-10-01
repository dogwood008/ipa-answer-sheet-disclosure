# Feature Specification: Change Text and Circle Color

**Feature Branch**: `004-html-1-2`
**Created**: 2025-09-28
**Status**: Draft
**Input**: User description: "記入する文字、円の色を変える機能を作ります。色はHTMLページで選択することができ、その選択方法は複数あります。 1) 黒、赤の２色はプリセットとして存在 2) カラーピッカーから選択 3) HTML Safe Colors からユーザが直接入力する"

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a user, I want to change the color of the text and the circle drawn on the PDF so that I can customize the output. I want multiple ways to select a color, including presets, a color picker, and direct input.

### Acceptance Scenarios
1.  **Given** the color selection interface is displayed, **When** I select the "Black" preset, **Then** the text and circle on the generated PDF are black.
2.  **Given** the color selection interface is displayed, **When** I select the "Red" preset, **Then** the text and circle on the generated PDF are red.
3.  **Given** the color selection interface is displayed, **When** I use the color picker to select a custom color (e.g., blue), **Then** the text and circle on the generated PDF are the selected color.
4.  **Given** the color selection interface is displayed, **When** I enter a valid HTML Safe Color name (e.g., "green") into the text input, **Then** the text and circle on the generated PDF are the specified color.

### Edge Cases
- If an invalid color name is entered in the text input, the system MUST default to a predefined color (e.g., black) and MUST NOT throw an error.
- The color of the text and the circle MUST always be the same.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: The system MUST provide an interface on the HTML page for color selection.
- **FR-002**: The color selection interface MUST include two preset color options: "Black" and "Red".
- **FR-003**: The color selection interface MUST include a color picker tool for selecting any color.
- **FR-004**: The color selection interface MUST include a text input field for users to enter an HTML Safe Color name.
- **FR-005**: The color selected through any of the available methods MUST be applied to both the user-input text and the drawn circle on the generated PDF.
- **FR-006**: If a user enters an invalid color name in the text input, the system MUST use a default color of black for the text and circle.
- **FR-007**: The system MUST apply the selected color to the PDF when the generation is triggered.

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