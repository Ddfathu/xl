<pre>// app/client/store/search.js
import { sendApiRequest } from '../engsel.js';

// 1. Mengambil Daftar Katalog Family Plan yang Tersedia
export async function getFamilyList({ apiKey, tokens, subsType = "PREPAID", isEnterprise = false, env }) {
  const path = "api/v8/xl-stores/options/search/family-list";
  const payload = { "is_enterprise": isEnterprise, "subs_type": subsType, "lang": "en" };
  
  const res = await sendApiRequest(apiKey, path, payload, tokens.id_token, "POST", env);
  
  if (!res || res.status !== "SUCCESS") {
    console.log("Failed to fetch family list.");
    return null;
  }
  return res;
}

// 2. Mengambil Seluruh Daftar Paket Toko/Retail Berdasarkan Filter
export async function getStorePackages({ apiKey, tokens, subsType = "PREPAID", isEnterprise = false, env }) {
  const path = "api/v9/xl-stores/options/search";
  const payload = {
    "is_enterprise": isEnterprise,
    "filters": [
      { "unit": "THOUSAND", "id": "FIL_SEL_P", "type": "PRICE", "items": [] },
      { "unit": "GB", "id": "FIL_SEL_MQ", "type": "DATA_TYPE", "items": [] },
      { "unit": "PACKAGE_NAME", "id": "FIL_PKG_N", "type": "PACKAGE_NAME", "items": [{ "id": "", "label": "" }] },
      { "unit": "DAY", "id": "FIL_SEL_V", "type": "VALIDITY", "items": [] }
    ],
    "substype": subsType,
    "text_search": "",
    "lang": "en"
  };
  
  const res = await sendApiRequest(apiKey, path, payload, tokens.id_token, "POST", env);
  
  if (!res || res.status !== "SUCCESS") {
    console.log("Failed to fetch store packages.");
    return null;
  }
  return res;
}</pre>