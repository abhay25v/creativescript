# Assessment Notes (Refactor + Fixes)

## Key issues identified

### Code quality / architecture
- `app/dashboard/page.tsx` was a large monolithic component (~1400 LOC) mixing UI, API calls, socket wiring, formatting utilities, and mock features.
- Repeated custom UI primitives (`Input`, `Button`) with inconsistent styling and inline styles.
- Auth logic used `window.location.href` in several places, which bypasses Next.js routing and can create unnecessary full reloads.

### Performance
- Multiple `useEffect` hooks without dependency arrays caused render loops (re-fetching users continuously).
- Search called the API but ignored the response (no UI update).
- History rendered 1500 rows directly (unnecessary work) and didn’t scale well.

### Real-time / WebSocket correctness
- Socket `login` event did not follow the required payload shape.
- Message sending emitted the `message` event twice.
- Incoming messages were normalized inconsistently (`msg.content` vs `msg.message`) and timestamp handling was incorrect.

## Changes implemented

### Design system + typography
- Updated global theme variables to match the palette from the prompt.
- Switched fonts to **Inter** (body) and **Plus Jakarta Sans** (headings).

Files:
- [app/globals.css](app/globals.css)
- [app/layout.tsx](app/layout.tsx)

### Shared utilities & UI primitives
- Added small shared helpers:
  - `apiClient` + `withAuth()`
  - `chatAuth` helpers (get/set/clear)
  - `cn()` utility for class merging
  - `useDebouncedValue()` hook
- Added reusable `Button` and `Input` components.

Files:
- [app/lib/apiClient.ts](app/lib/apiClient.ts)
- [app/lib/chatAuth.ts](app/lib/chatAuth.ts)
- [app/lib/constants.ts](app/lib/constants.ts)
- [app/lib/cn.ts](app/lib/cn.ts)
- [app/lib/useDebouncedValue.ts](app/lib/useDebouncedValue.ts)
- [app/components/ui/button.tsx](app/components/ui/button.tsx)
- [app/components/ui/input.tsx](app/components/ui/input.tsx)

### Auth flow
- Fixed an effect that ran every render.
- Uses Next router navigation (`router.replace/push`) instead of `window.location.href`.

Files:
- [app/auth/page.tsx](app/auth/page.tsx)
- [app/page.tsx](app/page.tsx)

### Dashboard fixes (socket, effects, history)
- Fixed user fetching render loop by adding proper effect dependencies.
- Search now updates the UI using debounced server-side filtering.
- Socket `login` now follows the spec: `socket.emit('login', { userId: String(...) })`.
- Message sending emits once and follows outgoing spec: `{ message, receiverId, senderId, mediaType: 'text' }`.
- Added socket cleanup on unmount.
- Added a lightweight virtualized History list to handle large datasets without extra dependencies.

Files:
- [app/dashboard/page.tsx](app/dashboard/page.tsx)
- [app/dashboard/components/HistoryTable.tsx](app/dashboard/components/HistoryTable.tsx)

## If I had more time
- Split `app/dashboard/page.tsx` further into feature modules (Chat / History / Settings / Analytics) + dedicated hooks (`useConnections`, `useMessages`, `useSocket`).
- Improve message filtering so incoming messages route to the correct conversation and add unread badges.
- Replace remaining inline styles with consistent Tailwind-based components.
- Add basic error UI states and retry for API failures.
