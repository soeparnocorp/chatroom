import {
	type LoaderFunctionArgs,
	type ActionFunctionArgs,
} from "@remix-run/cloudflare";
import { useLoaderData, Form, redirect } from "@remix-run/react";
import { TodoManager } from "~/to-do-manager";
import { requireUserId } from "~/auth/authenticator.server";
import { getUserId } from "~/auth/session.server";

// ============================================================
// LOADER: Ambil userId dari session, bukan dari params.id
// ============================================================
export const loader = async ({ request, params, context }: LoaderFunctionArgs) => {
	// 1. Proteksi: harus login
	const userId = await requireUserId(request);
	
	// 2. Gunakan userId sebagai key, bukan params.id
	const todoManager = new TodoManager(
		context.cloudflare.env.TO_DO_LIST,
		userId, // <--- Ganti params.id dengan userId
	);
	const todos = await todoManager.list();
	
	// 3. Kirim userId juga ke UI (opsional, untuk info)
	return { todos, userId };
};

// ============================================================
// ACTION: Gunakan userId dari session
// ============================================================
export async function action({ request, context, params }: ActionFunctionArgs) {
	// 1. Proteksi: harus login
	const userId = await requireUserId(request);
	
	// 2. Gunakan userId sebagai key
	const todoManager = new TodoManager(
		context.cloudflare.env.TO_DO_LIST,
		userId, // <--- Ganti params.id dengan userId
	);
	
	const formData = await request.formData();
	const intent = formData.get("intent");

	switch (intent) {
		case "create": {
			const text = formData.get("text");
			if (typeof text !== "string" || !text) {
				return Response.json({ error: "Invalid text" }, { status: 400 });
			}
			await todoManager.create(text);
			return { success: true };
		}

		case "toggle": {
			const id = formData.get("id") as string;
			if (!id) {
				return Response.json({ error: "ID required" }, { status: 400 });
			}
			await todoManager.toggle(id);
			return { success: true };
		}

		case "delete": {
			const id = formData.get("id") as string;
			if (!id) {
				return Response.json({ error: "ID required" }, { status: 400 });
			}
			await todoManager.delete(id);
			return { success: true };
		}

		default:
			return Response.json({ error: "Invalid intent" }, { status: 400 });
	}
}

// ============================================================
// UI: Tetap sama, tapi data sudah berdasarkan userId
// ============================================================
export default function TodoPage() {
	const { todos } = useLoaderData<typeof loader>();

	return (
		<div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
			<div className="max-w-md mx-auto">
				<h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">
					READTalk
				</h1>

				{/* Form Tambah To-Do */}
				<Form method="post" className="mb-8 flex gap-2">
					<input
						type="text"
						name="text"
						className="flex-1 rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white shadow-sm px-4 py-2"
						placeholder="Tambahkan to-do..."
						required
					/>
					<button
						type="submit"
						name="intent"
						value="create"
						className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
					>
						+
					</button>
				</Form>

				{/* Daftar To-Do */}
				{todos.length > 0 ? (
					<ul className="space-y-2">
						{todos.map((todo) => (
							<li
								key={todo.id}
								className="flex items-center gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
							>
								{/* Toggle (tandai selesai) */}
								<Form method="post" className="flex-1 flex items-center gap-2">
									<input type="hidden" name="id" value={todo.id} />
									<button
										type="submit"
										name="intent"
										value="toggle"
										className="text-blue-500 hover:text-gray-500 text-left flex-1"
									>
										<span
											className={
												todo.completed ? "line-through text-gray-400" : ""
											}
										>
											{todo.text}
										</span>
									</button>
								</Form>

								{/* Delete */}
								<Form method="post">
									<input type="hidden" name="id" value={todo.id} />
									<button
										type="submit"
										name="intent"
										value="delete"
										className="text-red-500 hover:text-red-700"
									>
										delete
									</button>
								</Form>
							</li>
						))}
					</ul>
				) : (
					<div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center">
						<p className="text-gray-500 dark:text-gray-400">
							Belum ada to-do. Tambahkan sekarang!
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
