import {
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
} from "@remix-run/cloudflare";
import { useLoaderData, Form, redirect } from "@remix-run/react";
import { URLManager } from "~/url-manager";

// ============================================================
// LOADER: Ambil data profil + daftar link dari KV
// ============================================================
export const loader = async ({ params, context }: LoaderFunctionArgs) => {
  const { username } = params;
  if (!username) {
    throw new Response("Username diperlukan", { status: 400 });
  }

  const manager = new URLManager(context.cloudflare.env.TO_DO_LIST);
  const profile = await manager.getProfileByUsername(username);

  if (!profile) {
    throw new Response("User tidak ditemukan", { status: 404 });
  }

  // Ambil semua link milik user ini
  const links = await manager.getLinksByUser(profile.userId);

  return { profile, links, username };
};

// ============================================================
// ACTION: Tambah / Hapus Link (dari dashboard)
// ============================================================
export async function action({ request, context, params }: ActionFunctionArgs) {
  const { username } = params;
  if (!username) {
    return Response.json({ error: "Username diperlukan" }, { status: 400 });
  }

  const manager = new URLManager(context.cloudflare.env.TO_DO_LIST);
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Cari userId dari username
  const profile = await manager.getProfileByUsername(username);
  if (!profile) {
    return Response.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  switch (intent) {
    case "add-link": {
      const title = formData.get("title") as string;
      const url = formData.get("url") as string;
      const shortCode = formData.get("shortCode") as string || undefined;

      if (!title || !url) {
        return Response.json({ error: "Judul dan URL wajib diisi" }, { status: 400 });
      }

      await manager.addLink(profile.userId, title, url, shortCode);
      return { success: true };
    }

    case "delete-link": {
      const linkId = formData.get("linkId") as string;
      if (!linkId) {
        return Response.json({ error: "ID link diperlukan" }, { status: 400 });
      }
      await manager.deleteLink(profile.userId, linkId);
      return { success: true };
    }

    case "update-profile": {
      const name = formData.get("name") as string;
      const bio = formData.get("bio") as string;
      await manager.updateProfile(profile.userId, { name, bio });
      return { success: true };
    }

    default:
      return Response.json({ error: "Perintah tidak dikenal" }, { status: 400 });
  }
}

// ============================================================
// UI: Halaman Profil + Dashboard
// ============================================================
export default function ProfilePage() {
  const { profile, links, username } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-md mx-auto">

        {/* ===== KARTU PROFIL ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl text-white font-bold">
            {profile.name?.[0] || username[0] || "?"}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {profile.name || username}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {profile.bio || "📌 Link in bio"}
          </p>
          <p className="text-gray-400 text-sm mt-1">@{username}</p>
        </div>

        {/* ===== FORM TAMBAH LINK ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            ➕ Tambah Link
          </h2>
          <Form method="post" className="space-y-3">
            <input
              type="text"
              name="title"
              placeholder="Judul (cth: Instagram)"
              className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white px-4 py-2"
              required
            />
            <input
              type="url"
              name="url"
              placeholder="URL (cth: https://instagram.com/...)"
              className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white px-4 py-2"
              required
            />
            <input
              type="text"
              name="shortCode"
              placeholder="Kode pendek (opsional, misal: ig)"
              className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white px-4 py-2"
            />
            <button
              type="submit"
              name="intent"
              value="add-link"
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              + Tambah Link
            </button>
          </Form>
        </div>

        {/* ===== DAFTAR LINK ===== */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            🔗 Daftar Link ({links.length})
          </h2>

          {links.length > 0 ? (
            <ul className="space-y-2">
              {links.map((link: any) => (
                <li
                  key={link.id}
                  className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 dark:text-white">
                      {link.title}
                    </p>
                    <div className="flex gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="truncate">{link.url}</span>
                      <span className="text-blue-500 font-mono whitespace-nowrap">
                        /{link.shortCode}
                      </span>
                    </div>
                  </div>

                  <Form method="post">
                    <input type="hidden" name="linkId" value={link.id} />
                    <button
                      type="submit"
                      name="intent"
                      value="delete-link"
                      className="text-red-500 hover:text-red-700 text-sm px-2 py-1"
                    >
                      ✕
                    </button>
                  </Form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Belum ada link. Tambahkan link pertama kamu!
            </p>
          )}
        </div>

        {/* ===== REDIRECT INFO ===== */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Setiap link punya kode pendek:{" "}
            <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
              domain.com/kode
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
