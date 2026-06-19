// app/routes/login.tsx
import { type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Form, useActionData, useSearchParams } from "@remix-run/react";
import { loginWithEmail } from "~/auth/authenticator.server";
import { commitSession, getSession } from "~/auth/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");

  // Jika sudah login, redirect ke dashboard
  if (userId) {
    throw new Response(null, {
      status: 302,
      headers: { Location: "/dashboard" },
    });
  }

  return null;
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const redirectTo = formData.get("redirectTo") as string || "/dashboard";

  try {
    const { user, headers } = await loginWithEmail(
      request,
      context.cloudflare.env.D1,
      email
    );

    // Redirect ke halaman yang diminta
    headers.append("Location", redirectTo);
    return new Response(null, {
      status: 302,
      headers,
    });
  } catch (error) {
    return { error: (error as Error).message };
  }
};

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const actionData = useActionData<typeof action>();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
          Login ke READTalk
        </h1>

        <Form method="post" className="space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="nama@email.com"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {actionData?.error && (
            <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              {actionData.error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            Login
          </button>
        </Form>

        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
          Login dengan email. Jika belum punya akun, akan otomatis dibuat.
        </p>

        <p className="text-xs text-gray-400 text-center mt-2">
          ✉️ Kode verifikasi akan dikirim ke email (untuk demo: langsung login)
        </p>
      </div>
    </div>
  );
}
