# WhatsAppClone Frontend

React + TypeScript + Vite frontend connected to the provided backend.

## Route organization

Authentication routes:
- `/auth/email`
- `/auth/otp`
- `/auth/two-step`

All logged-in application routes are inside `/user`:
- `/user/chats`
- `/user/chats/:conversationId`
- `/user/settings`
- `/user/profile`
- `/user/account`
- `/user/account/security`
- `/user/account/add-account`
- `/user/account/two-step`
- `/user/account/change-phone`
- `/user/account/request-info`
- `/user/account/delete`

## Setup

```bash
npm install
copy .env.example .env
npm run dev
```

Use this in `.env`:

```env
VITE_BACKEND_URL=https://server.aggr.co.in
```

The backend must be running on port 5000. New/existing email OTP, optional two-step PIN, profile, account, user email search, conversations and Socket.IO chat are integrated with the backend routes.

## Important backend compatibility

The current backend does not use JWT/session cookies. After OTP/PIN verification, this frontend stores the returned `userId` in localStorage and sends it as `x-user-id` on user API calls, exactly as required by the supplied backend middleware.
