<pre>// index.js

import { mainRouter } from './app/routers/mainRouter.js';
import { executeSentryCheck } from './app/service/sentry.js';
import { AuthInstance } from './app/service/auth.js';
import { BookmarkInstance } from './app/service/bookmark.js';

export default {
  /**
   * 1. HANDLER HTTP REQUEST
   * Fungsi pemicu utama saat API ditembak dari frontend web browser
   */
  async fetch(request, env, ctx) {
    // Mengamankan CORS preflight OPTIONS request browser
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, x-target-number",
        },
      });
    }

    try {
      // Pemicu inisialisasi state KV storage untuk modul enkripsi & bookmark
      await AuthInstance.init(env);
      await BookmarkInstance.loadBookmark(env);
      
      // Salurkan request ke pemeta URL router utama
      return await mainRouter(request, env);
    } catch (error) {
      console.error(`[Worker System Error]: ${error.message}`);
      return new Response(
        JSON.stringify({ 
          error: "Internal Worker Error", 
          details: error.message 
        }), 
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json", 
            "Access-Control-Allow-Origin": "*" 
          }
        }
      );
    }
  },

  /**
   * 2. HANDLER CRON TRIGGER
   * Berfungsi otomatis mengecek pemantauan kuota background (Pengganti Loop Sentry CLI)
   */
  async scheduled(event, env, ctx) {
    console.log(`[Cron Job] Sentry active check triggered at: ${new Date().toISOString()}`);
    
    ctx.waitUntil(
      executeSentryCheck(env)
        .then((res) => {
          console.log(`[Cron Job Success] Sentry scan completed.`);
        })
        .catch((err) => {
          console.error(`[Cron Job Failed] Sentry scan crash: ${err.message}`);
        })
    );
  }
};</pre>