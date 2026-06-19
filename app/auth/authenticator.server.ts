// app/auth/authenticator.server.ts
import { type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { getSession, commitSession, getUserId } from "./session.server";
import { getUserByEmail, createUser, type User } from "./user.server";

export type AuthResult = {
  user: User;
  session: any;
  headers: HeadersInit;
};

/**
 * Login dengan email (tanpa password, sesuai OpenAuth)
 * Kirim kode verifikasi ke email (untuk demo: langsung login)
 */
export async function loginWithEmail(
  request: Request,
  db: D1Database,
  email: string
): Promise<AuthResult> {
  if (!email || !email.includes("@")) {
    throw new Error("Email tidak valid");
  }

  // Cari user di database
  let user = await getUserByEmail(db, email);

  // Jika belum ada, buat user baru
  if (!user) {
    user = await createUser(db, { email });
  }

  // Buat session
  const session = await getSession();
  session.set("userId", user.id);

  const headers = new Headers();
  headers.append("Set-Cookie", await commitSession(session));

  return { user, session, headers };
}

/**
 * Cek apakah user sudah login
 */
export async function requireUserId(
  request: Request,
  redirectTo?: string
): Promise<string> {
  const userId = await getUserId(request);

  if (!userId) {
    const url = new URL(request.url);
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("redirectTo", redirectTo || url.pathname + url.search);
    throw new Response(null, {
      status: 302,
      headers: { Location: loginUrl.toString() },
    });
  }

  return userId;
}

/**
 * Cek apakah user sudah login (tanpa redirect)
 */
export async function getOptionalUser(
  request: Request,
  db: D1Database
): Promise<User | null> {
  const userId = await getUserId(request);
  if (!userId) return null;

  return getUserById(db, userId);
}

/**
 * Middleware untuk loader yang butuh login
 */
export function withAuthLoader(
  loaderFn: (args: LoaderFunctionArgs & { userId: string }) => Promise<any>
) {
  return async (args: LoaderFunctionArgs) => {
    const userId = await getUserId(args.request);

    if (!userId) {
      const url = new URL(args.request.url);
      const loginUrl = new URL("/login", url.origin);
      loginUrl.searchParams.set("redirectTo", url.pathname + url.search);
      throw new Response(null, {
        status: 302,
        headers: { Location: loginUrl.toString() },
      });
    }

    return loaderFn({ ...args, userId });
  };
}

/**
 * Middleware untuk action yang butuh login
 */
export function withAuthAction(
  actionFn: (args: ActionFunctionArgs & { userId: string }) => Promise<any>
) {
  return async (args: ActionFunctionArgs) => {
    const userId = await getUserId(args.request);

    if (!userId) {
      const url = new URL(args.request.url);
      const loginUrl = new URL("/login", url.origin);
      loginUrl.searchParams.set("redirectTo", url.pathname + url.search);
      throw new Response(null, {
        status: 302,
        headers: { Location: loginUrl.toString() },
      });
    }

    return actionFn({ ...args, userId });
  };
}
