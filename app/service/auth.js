class Auth {
  constructor() {
    this.users = [];
    this.apiKey = "";
    this.kvKey = "auth_users_state";
  }

  /**
   * Menginisialisasi state database auth dari Cloudflare KV
   */
  async init(env) {
    // Tarik API_KEY langsung dari panel Environment Variables Cloudflare
    this.apiKey = env.API_KEY || "";
    
    const kv = env.TOKENS_KV;
    if (!kv) {
      this.users = [];
      return;
    }

    const data = await kv.get(this.kvKey);
    if (data) {
      try {
        this.users = JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse auth users JSON from KV:", e);
        this.users = [];
      }
    } else {
      this.users = [];
      await kv.put(this.kvKey, JSON.stringify([]));
    }
  }

  async saveState(env) {
    const kv = env.TOKENS_KV;
    if (kv) {
      await kv.put(this.kvKey, JSON.stringify(this.users));
    }
  }

  async getActiveUser(env) {
    // Mengembalikan user pertama yang berstatus aktif atau index ke-0 sebagai default fallback
    if (this.users.length === 0) return null;
    const active = this.users.find(u => u.is_active === true);
    return active || this.users[0];
  }

  async addUser({ phoneNumber, tokens, env }) {
    // Setel user lain menjadi tidak aktif terlebih dahulu
    this.users.forEach(u => u.is_active = false);

    const existingIdx = this.users.findIndex(u => u.phone_number === phoneNumber);
    if (existingIdx !== -1) {
      this.users[existingIdx] = {
        phone_number: phoneNumber,
        tokens: tokens,
        is_active: true,
        updated_at: Date.now()
      };
    } else {
      this.users.push({
        phone_number: phoneNumber,
        tokens: tokens,
        is_active: true,
        updated_at: Date.now()
      });
    }
    await this.saveState(env);
  }

  async removeUser(phoneNumber, env) {
    this.users = this.users.filter(u => u.phone_number !== phoneNumber);
    await this.saveState(env);
  }

  async getAllUsers() {
    return [...this.users];
  }
}