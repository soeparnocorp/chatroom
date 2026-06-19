import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { Link } from "@remix-run/react";

import "./tailwind.css";

export const links: LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
];

// ============================================================
// LOADER: Ambil user dari session (optional)
// ============================================================
import { type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { getOptionalUser } from "~/auth/authenticator.server";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
	// Ambil user jika ada (tidak wajib login)
	const user = await getOptionalUser(request, context.cloudflare.env.D1);
	return { user };
};

// ============================================================
// LAYOUT: Tambahkan Header di atas children
// ============================================================
export function Layout({ children }: { children: React.ReactNode }) {
	const { user } = useLoaderData<typeof loader>() || { user: null };

	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{/* ===== HEADER ===== */}
				<header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
					<div className="max-w-4xl mx-auto flex justify-between items-center">
						{/* Logo / Brand */}
						<Link to="/" className="text-xl font-bold text-gray-800 dark:text-white">
							READTalk
						</Link>

						{/* User Info / Actions */}
						<div className="flex items-center gap-4">
							{user ? (
								<>
									{/* User Avatar + Nama */}
									<div className="flex items-center gap-2">
										<div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
											{user.displayName?.[0] || user.email?.[0] || "U"}
										</div>
										<span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:inline">
											{user.displayName || user.email}
										</span>
									</div>

									{/* Logout Button */}
									<Link
										to="/logout"
										className="text-sm text-red-500 hover:text-red-700"
									>
										Logout
									</Link>
								</>
							) : (
								<>
									{/* Login Link (hanya tampil jika di halaman non-login) */}
									<Link
										to="/login"
										className="text-sm text-blue-500 hover:text-blue-700"
									>
										Login
									</Link>
								</>
							)}
						</div>
					</div>
				</header>

				{/* ===== MAIN CONTENT ===== */}
				<main>{children}</main>

				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}
