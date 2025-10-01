# Quickstart: E2E Test for the Rewritten PoC

This document outlines the end-to-end test scenario for verifying the rewritten application.

## Prerequisites
- A running instance of the Vite development server.
- A browser environment controllable by Puppeteer.

## Test Scenario: Full user flow

1.  **Given** the user navigates to the application's URL.
2.  **Then** the main form is displayed with all input fields.
3.  **When** the user fills in the form with valid data.
4.  **And** the user clicks the "Generate PDF" button.
5.  **Then** a preview of the generated PDF is displayed on the page.
6.  **And** the PDF preview contains the data entered by the user in the correct positions.
7.  **When** the user clicks the "Download PDF" button.
8.  **Then** the generated PDF is downloaded to the user's computer.

## Automated Test Implementation
This will be implemented using Jest and Puppeteer in the `frontend/tests/e2e/` directory. The test will:
1.  Start the Vite dev server.
2.  Launch a browser and navigate to the application.
3.  Simulate user input into the form fields.
4.  Click the generation button.
5.  Wait for the PDF preview (e.g., in an `<iframe>` or `<embed>`) to be rendered.
6.  (Future enhancement) Parse the downloaded PDF to verify its contents. For the initial implementation, we can check for the presence of the preview element and the download link.
7.  Stop the Vite dev server.