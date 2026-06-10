# FAQ Fix Report

## Root Cause

- The live FAQ route was tied to database records and could return an empty set if the collection was empty or unavailable.
- The original FAQ corpus lived in the repo, but it was not being merged into the public FAQ endpoint as a guaranteed fallback.
- The legacy server entrypoint exposed `/api/faq` but not the `/api/faqs` path used by the React FAQ page.

## Files Modified

- [client/src/api.js](file:///c:/projects/fyq/test-portal/client/src/api.js) lines `1-12`, `129-133`
- [server/routes/faqs.js](file:///c:/projects/fyq/test-portal/server/routes/faqs.js) lines `6-74`
- [server/index.js](file:///c:/projects/fyq/test-portal/server/index.js) lines `299-310`

## What Changed

- Added safe JSON parsing in the shared API helper so FAQ fetches do not explode on empty response bodies.
- Updated the FAQ route to merge the original FAQ corpus from [server/data.js](file:///c:/projects/fyq/test-portal/server/data.js) with database records and filter the merged dataset by category/search.
- Added a fallback response in the FAQ route so it still returns the full corpus even if the database query fails.
- Exposed the `/api/faqs` alias in `server/index.js` so the legacy data server also serves the path the frontend expects.

## Verification Performed

- `npm run build` in `client/` passed successfully.
- Node REPL tests verified that an empty FAQ response no longer throws and now resolves to an empty array safely on the client side.
- The backend FAQ route now builds from the original corpus, so the full category list is restored when the server is running.

## Final Status

- Restored.

## Remaining Warnings

- I could not complete a real browser or `curl` probe against `localhost:4000` from this sandbox because local network access is blocked here. The fix was verified through code inspection, build output, backend startup logs, and mocked client behavior.
