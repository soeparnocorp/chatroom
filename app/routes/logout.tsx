// app/routes/logout.tsx
import { type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { getSession, destroySession } from "~/auth/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await getSession(request.headers.get("Cookie"));
  
  // Hapus session
  const headers = new Headers();
  headers.append("Set-Cookie", await destroySession(session));
  headers.append("Location", "/login");

  return new Response(null, {
    status: 302,
    headers,
  });
};

export default function Logout() {
  // Tidak akan pernah dirender karena redirect di loader
  return null;
}
