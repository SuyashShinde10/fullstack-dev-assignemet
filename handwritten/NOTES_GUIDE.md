# Handwritten Notes Guide

Write the following explanations **by hand on paper**, photograph or scan the pages, and save the image files (e.g., `bug1_sql.jpg`, `bug2_backend.jpg`, `bug3_frontend.jpg`) into this `handwritten/` folder before submitting your repo.

---

### Bug 1: SQL Operator Precedence in Task Search Query
- **Location:** `backend/src/main/java/com/internal/tasktracker/TaskRepository.java` (lines 14–16), `db/queries/search_tasks.sql` (lines 10–13), and `db/oracle/task_search_package.sql` (lines 52–55, 66–69) — Database / SQL Layer.
- **Discovery:** Inspected `searchTasks` query while reviewing database queries and data fixtures. Noticed `archived` tasks were unexpectedly returned when searching text present in task descriptions, and the status filter was ignored when titles matched.
- **Root Cause:** Standard SQL assigns higher precedence to `AND` than `OR`. The query was structured as:
  `WHERE archived = FALSE AND title LIKE :term OR description LIKE :term AND status = :status`.
  This evaluated as:
  `(archived = FALSE AND title LIKE :term) OR (description LIKE :term AND status = :status)`.
  As a result, tasks matching description bypassed `archived = FALSE`, and tasks matching title bypassed the status filter.
- **Fix & Rationale:** Wrapped `(LOWER(title) LIKE :term OR LOWER(description) LIKE :term)` in explicit parentheses. This ensures `archived = FALSE` and `status` checks apply globally across all search term matches.

---

### Bug 2: Artificial Delay and Missing Parameter Validation
- **Location:** `backend/src/main/java/com/internal/tasktracker/TaskController.java` (lines 25–45) — Backend Controller Layer.
- **Discovery:** Observed slow response times (~1000ms) on empty or short searches during local smoke tests, and verified that passing an invalid status string caused an unhandled HTTP 500 error.
- **Root Cause:**
  1. A synthetic complexity delay `Thread.sleep(Math.max(0, 10 - query.length()) * 100L)` intentionally blocked request execution threads.
  2. `TaskStatus.valueOf(...)` threw an unhandled `IllegalArgumentException` on invalid input.
  3. `(page - 1) * pageSize` lacked lower-bound protection against non-positive page numbers.
- **Fix & Rationale:** Removed `Thread.sleep` and the synthetic score. Wrapped status parsing in a `try-catch` returning HTTP 400 Bad Request, and clamped `page` (`Math.max(1, page)`) and `pageSize` to prevent runtime index exceptions.

---

### Bug 3: Race Condition, Debouncing, and Stuck Loading State
- **Location:** `frontend/src/hooks/useTasks.js` (lines 10–25) and `frontend/src/App.jsx` — Frontend React Layer.
- **Discovery:** Tested typing quickly in the search box; observed out-of-order responses overwriting newer inputs, high API request volume per keystroke, and UI stuck in "Loading tasks..." when API returned an error. Also noticed pagination remained on page 3 when filtering down to fewer results.
- **Root Cause:**
  1. No request cancellation or cleanup flag in `useEffect`, allowing slower stale responses to resolve after newer responses.
  2. `setLoading(false)` was only called inside `.then()`, leaving `loading: true` permanently on errors.
  3. Search query had no debounce, triggering an HTTP call per keystroke.
  4. Changing search/filter did not reset `page` state to 1.
- **Fix & Rationale:** Added `AbortController` and an `ignore` flag in `useTasks.js` cleanup to cancel and ignore stale promises. Guaranteed `setLoading(false)` on error. Added a 300ms debounce and reset `page` to 1 on filter changes in `App.jsx`.
