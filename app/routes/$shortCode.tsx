import { type LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { URLManager } from "~/url-manager";

export const loader = async ({ params, context }: LoaderFunctionArgs) => {
  const { shortCode } = params;
  if (!shortCode) {
    throw new Response("Kode tidak valid", { status: 400 });
  }

  const manager = new URLManager(context.cloudflare.env.TO_DO_LIST);
  const link = await manager.getLinkByShortCode(shortCode);

  if (!link) {
    throw new Response("Link tidak ditemukan", { status: 404 });
  }

  // Catat klik (async, tidak blocking redirect)
  context.waitUntil(manager.recordClick(shortCode));

  // Redirect ke URL asli
  return redirect(link.url);
};
