# Quickstart: E2E Test for Drawing a Circle

This document outlines the end-to-end test scenario for verifying the "draw a circle" feature.

## Prerequisites
- A running web server serving the PoC's HTML and JavaScript files.
- A browser environment controllable by Puppeteer.

## Test Scenario: User selects "Draw Circle" option

1.  **Given** the user opens the PoC web page.
2.  **And** the page contains a group of radio buttons for the drawing option.
3.  **When** the user selects the radio button with the value "draw".
4.  **And** the user triggers the PDF generation.
5.  **Then** the generated PDF should contain a black circle within the predefined rectangular area.

## Test Scenario: User selects "Don't Draw" option

1.  **Given** the user opens the PoC web page.
2.  **And** the page contains a group of radio buttons for the drawing option.
3.  **When** the user selects the radio button with the value "no-draw".
4.  **And** the user triggers the PDF generation.
5.  **Then** the generated PDF should **not** contain a circle within the predefined rectangular area.

## Automated Test Implementation
This will be implemented as a new Jest + Puppeteer test file in `tests/e2e/`. The test will:
1.  Launch a browser and navigate to the page.
2.  Simulate a click on the "draw" radio button.
3.  Trigger PDF generation.
4.  (Future enhancement) Parse the generated PDF to verify the circle's existence. For the PoC, we may rely on a visual confirmation or a flag from the JavaScript code.