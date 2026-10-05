# Notes

### Summary of Changes
- **SQL Operator Precedence**: Fixed unparenthesized `AND`/`OR` conditions in `TaskRepository.java`, `search_tasks.sql`, and `task_search_package.sql`. Previously, operator precedence caused description matches to return archived tasks and title matches to bypass status filters.
- **Backend Latency & Validation**: Removed artificial `Thread.sleep` delay in `TaskController.java`. Handled invalid status inputs with HTTP 400 Bad Request instead of throwing unhandled 500 exceptions, and clamped pagination bounds (`page >= 1`, `1 <= pageSize <= 100`) to prevent negative index errors.
- **Frontend Race Conditions & Debounce**: In `useTasks.js`, implemented `AbortController` request cancellation and cleanup flags to eliminate out-of-order race conditions, and ensured `loading` state resets on errors. In `App.jsx`, added 300ms debouncing and reset page to 1 upon query/filter updates.

### What Was Not Changed & Why
- Retained in-memory pagination (`List.subList`) rather than refactoring to Spring Data `Pageable` with database `LIMIT`/`OFFSET`. While in-memory slicing is sub-optimal for large datasets, refactoring query abstractions was deferred to maintain a small, high-confidence diff within the 90-minute timebox.
- Left the Oracle PL/SQL package as a reference artifact without orchestrating an Oracle DB container, as H2 is the target runtime.

### Biggest Remaining Risk
- **Full-Table Scans & Unindexed Text Search**: Searching with leading wildcards (`%query%`) on unindexed `title` and `description` forces full table scans. At scale, unindexed queries combined with in-memory result loading will exhaust database I/O and JVM heap memory. Production readiness requires database-level pagination and a dedicated full-text index or search engine.

### Tools & AI Usage
- Used Google Antigravity to inspect the multi-tier codebase, detect the SQL operator precedence bug, draft the React request cancellation and debounce logic, and verify backend/frontend builds.
