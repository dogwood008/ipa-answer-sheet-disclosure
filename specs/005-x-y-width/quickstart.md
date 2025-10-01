# Quickstart: E2E Test for Drawing a Rectangle

This document outlines the end-to-end test scenario for verifying the "draw a rectangle" feature.

## Prerequisites
- A running web server serving the PoC's HTML and JavaScript files.
- A browser environment controllable by Puppeteer.

## Test Scenario: User provides valid dimensions

1.  **Given** the user opens the PoC web page.
2.  **And** the page contains input fields for the rectangle's x, y, width, and height.
3.  **When** the user enters valid numeric dimensions (e.g., x=50, y=50, width=100, height=50).
4.  **And** the user triggers the PDF generation.
5.  **Then** the generated PDF should contain a rectangle drawn at the specified coordinates with the specified dimensions, using the currently selected color.

## Test Scenario: User provides invalid dimensions

1.  **Given** the user opens the PoC web page.
2.  **When** the user enters non-numeric or empty values in the dimension fields.
3.  **And** the user triggers the PDF generation.
4.  **Then** the generated PDF should **not** contain the rectangle.

## Automated Test Implementation
This will be implemented as a new Jest + Puppeteer test file in `tests/e2e/`. The test will:
1.  Launch a browser and navigate to the page.
2.  Simulate typing values into the dimension input fields.
3.  Trigger PDF generation.
4.  (Future enhancement) Parse the generated PDF to verify the rectangle's existence and properties. For the PoC, we may rely on a visual confirmation or a flag from the JavaScript code.