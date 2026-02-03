---
name: Data Processing & Optimization
description: Techniques for handling massive file loads and streaming data efficiently.
---

# Data Processing & Optimization

## Massive File Loads

1.  **Chunking**: When uploading large files, implement chunked uploads to avoid browser freezing and server timeouts.
2.  **Web Workers**: Use Web Workers for parsing or processing large datasets (e.g., CSV/JSON parsing) off the main thread to keep the UI responsive.
3.  **Validation**: Validate file types and sizes _before_ the upload process begins.

## Streaming Data

1.  **Backpressure**: Handle streams efficiently by respecting backpressure; do not overwhelm the UI with more data than it can render.
2.  **Virtual Scrolling**: If displaying large lists from a stream, use Virtual Scrolling (e.g., Angular CDK Virtual Scroll) to render only visible items.
3.  **Observables**: Use RxJS operators (`throttleTime`, `debounceTime`, `buffer`) to control the flow of incoming stream data.

## Memory Management

- Explicitly unsubscribe from data streams when components are destroyed (`ngOnDestroy` or `takeUntilDestroyed`).
- Avoid large in-memory objects; process data in streams or chunks where possible.
