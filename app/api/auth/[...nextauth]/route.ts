/**
 * @file app/api/auth/[...nextauth]/route.ts
 * @description NextAuth.js catch-all route handler. Delegates all auth
 * requests (sign-in, sign-out, callbacks, CSRF) to the configured handlers.
 */

import { handlers } from "@/auth";
export const { GET, POST } = handlers;