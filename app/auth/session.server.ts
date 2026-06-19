// app/auth/session.server.ts
import { createCookieSessionStorage } from "@remix-run/cloudflare";

// Cookie untuk menyimpan session user
const sessionCookie = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 hari
    path: "/",
    sameSite: "lax",
    secrets: ["s3cr3t-k3y-ch4ng3-m3"], // Ganti dengan secret dari env
    secure: process.env.NODE_ENV === "production",
  },
});

export const { getSession, commitSession, destroySession } = sessionCookie;

// Helper untuk mendapatkan userId dari session
export async function getUserId(request: Request): Promise<string | null> {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  return userId || null;
}

// Helper untuk membuat session baru
export async function createUserSession(
  userId: string,
  redirectTo: string
): Promise<{ session: any; headers: HeadersInit }> {
  const session = await getSession();
  session.set("userId", userId);

  const headers = new Headers();
  headers.append("Set-Cookie", await commitSession(session));

  return { session, headers };
}

// Helper untuk menghapus session (logout)
export async function logout(request: Request): Promise<HeadersInit> {
  const session = await getSession(request.headers.get("Cookie"));
  const headers = new Headers();
  headers.append("Set-Cookie", await destroySession(session));
  return headers;
}
