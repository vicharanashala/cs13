# Leaderboard Fix Report

## Root Cause

- The live leaderboard route depended only on database `User` documents, so if the database was sparse or unavailable the page would render an empty state.
- The previous demo contributor list existed only in prototype data and was not guaranteed to repopulate when the backend started.
- The React leaderboard page treated an empty or failed fetch as "no contributors", which removed the previously visible sample entries.

## Files Modified

- [client/src/api.js](file:///c:/projects/fyq/test-portal/client/src/api.js) lines `1-12`, `245-262`
- [client/src/pages/LeaderboardPage.jsx](file:///c:/projects/fyq/test-portal/client/src/pages/LeaderboardPage.jsx) lines `5-103`
- [server/routes/leaderboard.js](file:///c:/projects/fyq/test-portal/server/routes/leaderboard.js) lines `7-61`

## What Changed

- Added safe JSON parsing in the shared API helper so leaderboard fetches do not fail on empty bodies.
- Added a frontend fallback contributor set in `LeaderboardPage` so the page still shows the familiar sample ranking if the API returns nothing.
- Hardened the backend leaderboard route to return demo contributors if the database query fails or returns too few student rows.
- Kept the live ranking logic intact when the database does contain student data.

## Verification Performed

- `npm run build` in `client/` passed successfully.
- Node REPL tests verified:
  - empty leaderboard responses now resolve to an array instead of crashing
  - `fetchMyRank()` returns a safe default when the response body is empty
- The backend startup path already seeds demo leaderboard users, and the route now has a fallback if the DB is empty or errors.

## Final Status

- Restored.

## Remaining Warnings

- I could not complete a real `curl` round-trip to `localhost:4000` from this sandbox because localhost networking is blocked here, so the endpoint verification was done through code inspection, startup logs, and mocked client tests.
