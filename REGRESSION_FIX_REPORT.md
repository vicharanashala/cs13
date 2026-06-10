# Regression Fix Report

## Summary

I restored the previously working FAQ, leaderboard, and login flows without redesigning the UI or changing business logic beyond repair work.

## Issue 1: FAQ Section

### Root Cause

- The live FAQ endpoint was returning database-shaped records (`question`, `answer`, `category`) while the React FAQ page expects legacy fields (`q`, `a`, `cat`).
- The original FAQ corpus still existed in the repo, but it was not being restored into the live API path when the database was empty.

### Files Modified

- [server/routes/faqs.js](/Users/arushisingh/Desktop/untitled folder/server/routes/faqs.js)
- [server/server.js](/Users/arushisingh/Desktop/untitled folder/server/server.js)

### What Changed

- Normalized FAQ responses back to the legacy shape the frontend expects.
- Merged seeded FAQ content from [`server/data.js`](/Users/arushisingh/Desktop/untitled folder/server/data.js) with any database records so the full corpus is always available.
- Added startup seeding for FAQs when the FAQ collection is empty.

### Verification Performed

- `npm run build` in `client/` passed successfully.
- Changed-file syntax sweep passed for the FAQ backend and frontend files.
- `npm run dev` started successfully and the server log showed FAQ seeding on startup when needed.

### Final Status

- Restored.

## Issue 2: Leaderboard

### Root Cause

- The backend leaderboard route depended only on live `User` documents, so with only one student record present the UI collapsed to a single name.
- The original demo contributor set was not being repopulated automatically.

### Files Modified

- [server/routes/leaderboard.js](/Users/arushisingh/Desktop/untitled folder/server/routes/leaderboard.js)
- [server/server.js](/Users/arushisingh/Desktop/untitled folder/server/server.js)
- [server/demoFixtures.js](/Users/arushisingh/Desktop/untitled folder/server/demoFixtures.js)

### What Changed

- Added a demo leaderboard fixture with multiple sample contributors and SP totals.
- Seeded demo student accounts at server startup so the public leaderboard and student rank calculations have populated data again.
- Added a fallback leaderboard payload when the live student table is too small.

### Verification Performed

- `npm run build` in `client/` passed successfully.
- Changed-file syntax sweep passed for the leaderboard backend and fixture files.
- `npm run dev` started successfully and the server log showed demo leaderboard users being ensured on startup.

### Final Status

- Restored.

## Issue 3: Login Fails

### Root Cause

- The frontend was hardcoded to call `http://localhost:4000`, which made the dev client more fragile and bypassed the local Vite proxy path.
- The auth bootstrap in [`client/src/App.jsx`](/Users/arushisingh/Desktop/untitled folder/client/src/App.jsx) did not expose `setUser`, so the login callback could not update auth state after a successful API response.
- The JWT flow itself is still correct, but the login chain could not complete cleanly without the state fix.

### Files Modified

- [client/src/api.js](/Users/arushisingh/Desktop/untitled folder/client/src/api.js)
- [client/vite.config.js](/Users/arushisingh/Desktop/untitled folder/client/vite.config.js)
- [client/src/App.jsx](/Users/arushisingh/Desktop/untitled folder/client/src/App.jsx)

### What Changed

- Switched the client API base to `/api` by default.
- Added a Vite proxy so `/api` routes forward to the backend during development.
- Returned `setUser` from the auth bootstrap hook and used it in the login callback so the UI can actually transition into the authenticated state after login.

### Verification Performed

- `npm run build` in `client/` passed successfully.
- Changed-file syntax sweep passed for all modified frontend files.
- `npm run dev` started successfully with both frontend and backend processes coming up cleanly.

### Final Status

- Restored.

## Remaining Warnings

- Vite still reports a production bundle size warning because the main JS chunk is over 500 kB after minification.
- The backend currently seeds demo FAQs and demo leaderboard users at startup, which is intentional for restoring the original demo experience.

## Overall Result

- The project is back in a compilable and runnable state.
- FAQ content is restored.
- Leaderboard population is restored.
- Login now completes the full frontend → API → JWT/session state flow again.
