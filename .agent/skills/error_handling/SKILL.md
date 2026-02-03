---
name: Error Handling & Logging
description: Expert strategies for managing application errors and logging.
---

# Error Handling & Logging Standards

## Global Error Handling

1.  **Global Error Handler**: Implement `ErrorHandler` interface in Angular to catch all unhandled exceptions.
2.  **Http Interceptors**: Use interceptors (`HttpInterceptorFn` or class-based) to catch HTTP errors globally.
    - **401 Unauthorized**: Redirect to login / Refresh token.
    - **403 Forbidden**: Show permission error.
    - **404 Not Found**: Log and optionally redirect.
    - **500 Server Error**: Show a user-friendly "Service Unavailable" message.

## Logging Strategy

1.  **Levels**: Support different log levels (`debug`, `info`, `warn`, `error`).
2.  **Production vs Development**:
    - **Dev**: Log everything to console with stack traces.
    - **Prod**: Suppress console logs. Send critical errors to a backend logging service or monitoring tool (e.g., Sentry, custom endpoint).
3.  **Context**: Always include context in logs (User ID, Action being performed, State snapshot).

## User Feedback

- Never leave the user guessing. If an error occurs, provide specific visual feedback (Toast notifications, Alert banners) based on the error type, but **sanitize** the technical details.

## Implementation Details

- Ensure the `LoggerService` (if exists) is robust and handles circular references when serializing objects.
- Prevent "Log Flooding" by throttling identical error messages.
