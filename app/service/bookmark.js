<pre>// app/service/bookmark.js

class Bookmark {
  constructor() {
    this.packages = [];
    this.kvKey = "user_bookmarks";
  }

  /**
   * Mengamankan struktur data (Schema Checker) agar field baru selalu ada
   */
  async _ensureSchema(env) {
    let updated = false;
    for (let p of this.packages) {
      if (!("family_name" in p)) {
        p.family_name = "";
        updated = true;
      }
      if (!("order" in p)) {
        p.order = 0;
        updated = true;
      }
    }
    if (updated) {
      await this.saveBookmark(env);
    }
  }

  /**
   * Memuat data bookmark dari Cloudflare KV Storage
   */
  async loadBookmark(env) {
    const kv = env.TOKENS_KV;
    if (!kv) {
      this.packages = [];
      return;
    }
    
    const data = await kv.get(this.kvKey);
    if (data) {
      try {
        this.packages = JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse bookmark JSON from KV:", e);
        this.packages = [];
      }
    } else {
      this.packages = [];
      await kv.put(this.kvKey, JSON.stringify([]));
    }
    
    await this._ensureSchema(env);
  }

  /**
   * Menyimpan data bookmark saat ini ke Cloudflare KV Storage
   */
  async saveBookmark(env) {
    const kv = env.TOKENS_KV;
    if (kv) {
      await kv.put(this.kvKey, JSON.stringify(this.packages));
    }
  }

  /**
   * Menambah bookmark baru jika belum terdaftar
   */
  async addBookmark({ familyCode, familyName, isEnterprise, variantName, optionName, order, env }) {
    await this.loadBookmark(env);

    const exists = this.packages.some(
      p => p.family_code === familyCode && p.variant_name === variantName && p.order === order
    );

    if (exists) {
      console.log("Bookmark already exists.");
      return false;
    }

    this.packages.push({
      family_name: familyName,
      family_code: familyCode,
      is_enterprise: isEnterprise,
      variant_name: variantName,
      option_name: optionName,
      order: order
    });

    await this.saveBookmark(env);
    console.log("Bookmark added.");
    return true;
  }

  /**
   * Menghapus data bookmark tertentu
   */
  async removeBookmark(familyCode, isEnterprise, variantName, order, env) {
    await this.loadBookmark(env);

    const initialLength = this.packages.length;
    this.packages = this.packages.filter(
      p => !(
        p.family_code === familyCode &&
        p.is_enterprise === isEnterprise &&
        p.variant_name === variantName &&
        p.order === order
      )
    );

    if (this.packages.length < initialLength) {
      await this.saveBookmark(env);
      console.log("Bookmark removed.");
      return true;
    }

    console.log("Bookmark not found.");
    return false;
  }

  /**
   * Mengambil klon seluruh isi array data bookmark
   */
  async getBookmarks(env) {
    await this.loadBookmark(env);
    return [...this.packages];
  }
}

export const BookmarkInstance = new Bookmark();</pre>