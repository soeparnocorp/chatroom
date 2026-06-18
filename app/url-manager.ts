// ============================================================
// TIPE DATA
// ============================================================
interface Profile {
  userId: string;
  username: string;
  name: string;
  bio: string;
  avatar?: string;
  createdAt: string;
}

interface Link {
  id: string;
  userId: string;
  title: string;
  url: string;
  shortCode: string;
  clicks: number;
  createdAt: string;
}

// ============================================================
// URL MANAGER CLASS
// ============================================================
export class URLManager {
  constructor(private kv: KVNamespace) {}

  // ==========================================================
  // PROFIL
  // ==========================================================

  /**
   * Ambil profil berdasarkan username
   */
  async getProfileByUsername(username: string): Promise<Profile | null> {
    const userId = await this.kv.get(`username:${username}`);
    if (!userId) return null;
    return this.kv.get(`profile:${userId}`, "json");
  }

  /**
   * Ambil profil berdasarkan userId
   */
  async getProfileByUserId(userId: string): Promise<Profile | null> {
    return this.kv.get(`profile:${userId}`, "json");
  }

  /**
   * Buat profil baru
   */
  async createProfile(username: string, name: string): Promise<Profile> {
    const userId = crypto.randomUUID();
    const profile: Profile = {
      userId,
      username,
      name: name || username,
      bio: "",
      createdAt: new Date().toISOString(),
    };

    // Simpan profil
    await this.kv.put(`profile:${userId}`, JSON.stringify(profile));
    // Simpan mapping username → userId
    await this.kv.put(`username:${username}`, userId);
    // Inisialisasi daftar link kosong
    await this.kv.put(`user:${userId}:links`, JSON.stringify([]));

    return profile;
  }

  /**
   * Update profil (name, bio, avatar)
   */
  async updateProfile(
    userId: string,
    data: Partial<Pick<Profile, "name" | "bio" | "avatar">>
  ): Promise<Profile> {
    const profile = await this.getProfileByUserId(userId);
    if (!profile) throw new Error("Profil tidak ditemukan");

    const updated = { ...profile, ...data };
    await this.kv.put(`profile:${userId}`, JSON.stringify(updated));
    return updated;
  }

  // ==========================================================
  // LINK
  // ==========================================================

  /**
   * Ambil semua link milik user
   */
  async getLinksByUser(userId: string): Promise<Link[]> {
    const linkIds = await this.kv.get(`user:${userId}:links`, "json") || [];
    const links: Link[] = [];

    for (const id of linkIds) {
      const link = await this.kv.get(`link:${id}`, "json");
      if (link) links.push(link);
    }

    // Urutkan dari yang terbaru
    return links.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Ambil satu link berdasarkan shortCode
   */
  async getLinkByShortCode(shortCode: string): Promise<Link | null> {
    const linkId = await this.kv.get(`short:${shortCode}`);
    if (!linkId) return null;
    return this.kv.get(`link:${linkId}`, "json");
  }

  /**
   * Tambah link baru
   */
  async addLink(
    userId: string,
    title: string,
    url: string,
    customShortCode?: string
  ): Promise<Link> {
    // Generate shortCode (otomatis atau custom)
    let shortCode = customShortCode;
    if (!shortCode) {
      shortCode = this.generateShortCode();
    }

    // Cek apakah shortCode sudah dipakai
    const existing = await this.kv.get(`short:${shortCode}`);
    if (existing) {
      throw new Error(`Kode "${shortCode}" sudah digunakan. Pilih kode lain.`);
    }

    const link: Link = {
      id: crypto.randomUUID(),
      userId,
      title,
      url,
      shortCode,
      clicks: 0,
      createdAt: new Date().toISOString(),
    };

    // Simpan link
    await this.kv.put(`link:${link.id}`, JSON.stringify(link));
    // Simpan mapping shortCode → linkId
    await this.kv.put(`short:${shortCode}`, link.id);

    // Tambahkan ke daftar link user
    const userLinks = await this.kv.get(`user:${userId}:links`, "json") || [];
    userLinks.push(link.id);
    await this.kv.put(`user:${userId}:links`, JSON.stringify(userLinks));

    return link;
  }

  /**
   * Hapus link
   */
  async deleteLink(userId: string, linkId: string): Promise<void> {
    // Ambil link dulu untuk dapat shortCode-nya
    const link = await this.kv.get(`link:${linkId}`, "json");
    if (!link) throw new Error("Link tidak ditemukan");

    // Hapus data link
    await this.kv.delete(`link:${linkId}`);
    await this.kv.delete(`short:${link.shortCode}`);

    // Hapus dari daftar user
    const userLinks = await this.kv.get(`user:${userId}:links`, "json") || [];
    const updated = userLinks.filter((id: string) => id !== linkId);
    await this.kv.put(`user:${userId}:links`, JSON.stringify(updated));
  }

  /**
   * Catat klik pada link (untuk redirect)
   */
  async recordClick(shortCode: string): Promise<void> {
    const linkId = await this.kv.get(`short:${shortCode}`);
    if (!linkId) return;

    const link = await this.kv.get(`link:${linkId}`, "json");
    if (link) {
      link.clicks = (link.clicks || 0) + 1;
      await this.kv.put(`link:${linkId}`, JSON.stringify(link));
    }
  }

  // ==========================================================
  // UTILITY
  // ==========================================================

  /**
   * Generate kode pendek random 6 karakter
   */
  private generateShortCode(): string {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
