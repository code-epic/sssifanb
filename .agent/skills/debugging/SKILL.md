---
name: Debugging & Running
description: How to run, debug, and test the application
---

# Debugging and Running

## Running the Application

- **Development Server**: Run `npm start`.
  - This runs `ng serve` with a proxy configuration (`src/proxy.conf.json`).
  - Host: `0.0.0.0` (accessible from network).
  - Port: `4202`.
  - Disable production mode.
- **Alternative Start**: `npm run start2` (similar but maybe different flags/env).

## Proxy Configuration

- The app uses `src/proxy.conf.json` to forward API requests to the backend.
- Essential for avoiding CORS issues during development.
- Check this file if API calls fail with 404 or CORS errors locally.

## Testing

- **Unit Tests**: `npm test` (Runs `ng test` / Karma).
- **E2E Tests**: `npm run e2e` (Protractor).

## Linting

- Run `npm run lint` to check for code style issues.
