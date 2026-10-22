---
title: Local dev login
type: system
tags: [local, login, dev, seed]
sources: [proppilot-backend/src/main/resources/application-local.yml, proppilot-frontend/src/components/LoginPage.jsx]
updated: 2026-10-22
---

# Local dev login

How to log in to the local stack without Google. The stack itself is in [[harness]] and [[testing]].

## Steps

1. Open `http://localhost:3000`. Profile `local` shows the banner "Local Dev Mode - No Google OAuth required" (`proppilot-frontend/src/components/LoginPage.jsx:108`).
2. There is no password.
3. In "Custom User", type the dev email in the Email field (`LoginPage.jsx:130`).
4. Press "Login as Local User" (`LoginPage.jsx:150`). The button text may render in capitals.

## Dev user

The seed data belongs to the dev user. Its email is set in `proppilot-backend/src/main/resources/application-local.yml`, key `app.local-dev.email` (line 7). The value is Juan's own Gmail, `juanmgracia@gmail.com`. The yml comment says the same email lets local dev share data with Google SSO.

Data is scoped per owner. Any other user sees an empty app.

## Quick login buttons

"Quick Login (Test Users)" has three buttons: Alice Test, Bob Test, Charlie Test (`LoginPage.jsx:87-90`). They have no seed data. Use them only to check empty states.

## What the dashboard shows (checked 22 Oct 2026)

The coordinator checked this in Chrome after logging in as the dev user:
- 6 properties
- 6 active tenants
- 5 active leases
- 1 pending payment

This check was done in the browser, not by a test. Code cite for the counts: UNVERIFIED.
