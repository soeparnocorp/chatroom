// app/routes/_index.tsx
import { type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/react";
import { getUserId } from "~/auth/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);

  // Jika sudah login, redirect ke dashboard
  if (userId) {
    return redirect("/dashboard");
  }

  // Jika belum login, redirect ke halaman login
  return redirect("/login");
};

export default function Index() {
  // Tidak akan pernah dirender karena redirect di loader
  return null;
}
