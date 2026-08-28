import { createAuthClient } from 'better-auth/react';

// When baseURL is omitted, Better Auth uses relative requests (/api/auth) on the current browser domain
export const authClient = createAuthClient();

export const { useSession, signIn, signOut, signUp } = authClient;
