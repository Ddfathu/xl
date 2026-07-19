<pre>// app/client/store/redeemables.js
import { sendApiRequest } from '../engsel.js';

export async function getRedeemables({ apiKey, tokens, isEnterprise = false, env }) {
  const path = "api/v8/personalization/redeemables";
  const payload = { "is_enterprise": isEnterprise, "lang": "en" };
  
  const res = await sendApiRequest(apiKey, path, payload, tokens.id_token, "POST", env);
  
  if (!res || res.status !== "SUCCESS") {
    console.log("Failed to fetch redeemable.");
    return null;
  }
  return res;
}</pre>