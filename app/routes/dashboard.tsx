// app/routes/dashboard.tsx
import { type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserId, getOptionalUser } from "~/auth/authenticator.server";
import { getUserId } from "~/auth/session.server";
import { TodoManager } from "~/to-do-manager";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  // Proteksi: harus login
  const userId = await requireUserId(request);
  
  // Ambil data user
  const user = await getOptionalUser(request, context.cloudflare.env.D1);
  
  // Ambil to-do list user
  const todoManager = new TodoManager(
    context.cloudflare.env.TO_DO_LIST,
    userId // <-- key = userId, bukan params.id
  );
  const todos = await todoManager.list();

  return { user, todos };
};

export default function Dashboard() {
  const { user, todos } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header dengan user info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {user?.displayName?.[0] || user?.email?.[0] || "?"}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {user?.displayName || user?.email || "User"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {todos.length} to-do
                </p>
              </div>
            </div>
            <Link
              to="/logout"
              className="text-sm text-red-500 hover:text-red-700"
            >
              Logout
            </Link>
          </div>
        </div>

        {/* Form tambah to-do */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            READTalk
          </h1>

          <form method="post" className="flex gap-2">
            <input
              type="text"
              name="text"
              placeholder="Tambahkan to-do..."
              className="flex-1 rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white px-4 py-2"
            />
            <button
              type="submit"
              name="intent"
              value="create"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              +
            </button>
          </form>
        </div>

        {/* Daftar to-do */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          {todos.length > 0 ? (
            <ul className="space-y-2">
              {todos.map((todo: any) => (
                <li
                  key={todo.id}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-3 rounded-lg"
                >
                  <span className={todo.completed ? "line-through text-gray-400" : ""}>
                    {todo.text}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      name="intent"
                      value="toggle"
                      className="text-blue-500 hover:text-blue-700"
                    >
                      ✓
                    </button>
                    <button
                      type="submit"
                      name="intent"
                      value="delete"
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Belum ada to-do. Tambahkan sekarang!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
