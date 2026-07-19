import { getProfile } from '../client/engsel.js';
import { AuthInstance } from './auth.js';

/**
 * Pengganti Loop Sentry CLI luar: Mengecek status kuota paket secara terjadwal via Cron Cloudflare Worker
 */
export async function executeSentryCheck(env) {
  // Pastikan instance auth terisi state terbarunya dari KV
  await AuthInstance.init(env);
  const apiKey = AuthInstance.apiKey;
  const users = await AuthInstance.getAllUsers();

  if (users.length === 0) {
    console.log("[Sentry Scan] Tidak ada akun terdaftar untuk dimonitor.");
    return { status: "empty" };
  }

  console.log(`[Sentry Scan] Memulai pemindaian otomatis untuk ${users.length} akun...`);
  
  for (const user of users) {
    try {
      console.log(`[Sentry Scan] Memeriksa akun: ${user.phone_number}`);
      const profileData = await getProfile(apiKey, user.tokens, env);
      
      if (!profileData || profileData.status !== "SUCCESS") {
        console.warn(`[Sentry Alert] Sesi token untuk nomor ${user.phone_number} terindikasi mati/invalid.`);
        continue;
      }
      
      const balance = profileData.data?.balance?.available_balance ?? 0;
      console.log(`[Sentry Monitor] Nomor: ${user.phone_number} | Pulsa: Rp ${balance}`);
      
    } catch (err) {
      console.error(`[Sentry Error] Eror memproses nomor ${user.phone_number}:`, err.message);
    }
  }

  return { status: "done", scanned_accounts: users.length };
}