// app/auth/user.server.ts
import { D1Database } from "@cloudflare/workers-types";

export type User = {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
};

export type UserCreate = {
  email: string;
  displayName?: string;
  avatarUrl?: string;
};

// Generate random ID (sama dengan di D1: randomblob(16))
function generateUserId(): string {
  const buf = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Cari user berdasarkan email
 */
export async function getUserByEmail(
  db: D1Database,
  email: string
): Promise<User | null> {
  const result = await db
    .prepare("SELECT * FROM user WHERE email = ?")
    .bind(email)
    .first<User>();

  return result || null;
}

/**
 * Cari user berdasarkan ID
 */
export async function getUserById(
  db: D1Database,
  id: string
): Promise<User | null> {
  const result = await db
    .prepare("SELECT * FROM user WHERE id = ?")
    .bind(id)
    .first<User>();

  return result || null;
}

/**
 * Buat user baru
 */
export async function createUser(
  db: D1Database,
  data: UserCreate
): Promise<User> {
  const id = generateUserId();

  const result = await db
    .prepare(
      `
      INSERT INTO user (id, email, created_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      RETURNING *
    `
    )
    .bind(id, data.email)
    .first<User>();

  if (!result) {
    throw new Error("Gagal membuat user");
  }

  return result;
}

/**
 * Update user (displayName, avatarUrl)
 */
export async function updateUser(
  db: D1Database,
  id: string,
  data: Partial<Pick<User, "displayName" | "avatarUrl">>
): Promise<User | null> {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.displayName !== undefined) {
    fields.push("displayName = ?");
    values.push(data.displayName);
  }
  if (data.avatarUrl !== undefined) {
    fields.push("avatarUrl = ?");
    values.push(data.avatarUrl);
  }

  if (fields.length === 0) return getUserById(db, id);

  values.push(id);

  const result = await db
    .prepare(
      `
      UPDATE user
      SET ${fields.join(", ")}
      WHERE id = ?
      RETURNING *
    `
    )
    .bind(...values)
    .first<User>();

  return result || null;
}
