<pre>// app/menus/payment.js
import { sendApiRequest } from '../client/engsel.js';

export async function showTransactionHistory(apiKey, tokens, env) {
  const path = "payments/api/v8/history";
  const payload = { "lang": "en", "limit": 10, "offset": 0 };
  const res = await sendApiRequest(apiKey, path, payload, tokens.id_token, "POST", env);
  
  if (!res || res.status !== "SUCCESS") {
    return { status: "error", message: "Gagal mengambil riwayat transaksi.", details: res };
  }
  return { status: "success", data: res.data };
}</pre>