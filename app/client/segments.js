<pre>// app/client/store/segments.js
import { sendApiRequest } from '../engsel.js';

/**
 * Mengambil data segmen konfigurasi store/promo user
 */
export async function getSegments({
  apiKey,
  tokens,
  isEnterprise = false,
  env
}) {
  const path = "api/v8/configs/store/segments";
  const payload = {
    "is_enterprise": isEnterprise,
    "lang": "en"
  };
  
  const res = await sendApiRequest(apiKey, path, payload, tokens.id_token, "POST", env);
  
  if (!res || res.status !== "SUCCESS") {
    console.log("Failed to fetch segments.");
    console.log(`Error: ${JSON.stringify(res)}`);
    return null;
  }
  
  return res;
}</pre>