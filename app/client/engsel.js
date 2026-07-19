<pre>// app/client/engsel.js
import { decryptXdata, encryptsignXdata } from './encrypt.js';

// Helper Global untuk Otomatisasi Request ke Server Telko
export async function sendApiRequest(apiKey, path, payload, token = null, method = "POST", env) {
  const baseApiUrl = env.BASE_API_URL || "";
  const encryptedPayload = await encryptsignXdata(apiKey, method, path, token, payload, env);
  
  const xtime = Number(encryptedPayload.encrypted_body.xtime);
  const sigTimeSec = Math.floor(xtime / 1000);
  
  const headers = {
    "host": baseApiUrl.replace("https://", ""),
    "content-type": "application/json; charset=utf-8",
    "user-agent": env.UA || "",
    "x-api-key": env.API_KEY || apiKey,
    "x-hv": "v3",
    "x-signature-time": String(sigTimeSec),
    "x-signature": encryptedPayload.signature,
    "x-request-id": crypto.randomUUID(),
    "x-version-app": "8.9.0",
  };

  if (token) {
    headers["authorization"] = `Bearer ${token}`;
  }

  const url = `${baseApiUrl}/${path}`;
  const response = await fetch(url, {
    method: method,
    headers: headers,
    body: JSON.stringify(encryptedPayload.encrypted_body)
  });

  const respText = await response.text();
  try {
    const jsonParsed = JSON.parse(respText);
    return await decryptXdata(apiKey, jsonParsed, env);
  } catch (e) {
    return { status: "raw", data: respText };
  }
}

export async function requestOtp(apiKey, phoneNumber, env) {
  const path = "api/v5/auth/otp/request";
  const payload = { "msisdn": phoneNumber, "lang": "en" };
  return await sendApiRequest(apiKey, path, payload, null, "POST", env);
}

export async function submitOtp(apiKey, phoneNumber, otp, env) {
  const path = "api/v5/auth/otp/verify";
  const payload = { "msisdn": phoneNumber, "otp": otp, "lang": "en" };
  return await sendApiRequest(apiKey, path, payload, null, "POST", env);
}

export async function getProfile(apiKey, tokens, env) {
  const path = "api/v6/users/profile";
  const payload = { "lang": "en" };
  return await sendApiRequest(apiKey, path, payload, tokens.id_token, "POST", env);
}

export async function getDashboard(apiKey, tokens, env) {
  const path = "api/v8/family/dashboard";
  const payload = { "lang": "en" };
  return await sendApiRequest(apiKey, path, payload, tokens.id_token, "POST", env);
}

export async function changeMember(apiKey, tokens, slotNumber, targetMsisdn, parentAlias, childAlias, env) {
  const path = "api/v8/family/change-member";
  const payload = {
    "slot_number": slotNumber,
    "target_msisdn": targetMsisdn,
    "parent_alias": parentAlias,
    "child_alias": childAlias,
    "lang": "en"
  };
  return await sendApiRequest(apiKey, path, payload, tokens.id_token, "POST", env);
}

export async function removeMember(apiKey, tokens, slotNumber, env) {
  const path = "api/v8/family/remove-member";
  const payload = { "slot_number": slotNumber, "lang": "en" };
  return await sendApiRequest(apiKey, path, payload, tokens.id_token, "POST", env);
}

export async function setQuotaLimit(apiKey, tokens, slotNumber, newQuotaMb, env) {
  const path = "api/v8/family/set-quota-limit";
  const payload = { "slot_number": slotNumber, "quota_mb": newQuotaMb, "lang": "en" };
  return await sendApiRequest(apiKey, path, payload, tokens.id_token, "POST", env);
}

export async function getFamily(apiKey, tokens, familyCode, isEnterprise, env) {
  const path = "api/v8/xl-stores/options/search/family-detail";
  const payload = { "family_code": familyCode, "is_enterprise": isEnterprise, "lang": "en" };
  return await sendApiRequest(apiKey, path, payload, tokens.id_token, "POST", env);
}

export async function getPackageDetails(apiKey, tokens, familyCode, variantCode, order, isEnterprise, migrationType = "", env) {
  const path = "api/v8/xl-stores/options/search/package-detail";
  const payload = {
    "family_code": familyCode,
    "variant_code": variantCode,
    "order": order,
    "is_enterprise": isEnterprise,
    "migration_type": migrationType,
    "lang": "en"
  };
  return await sendApiRequest(apiKey, path, payload, tokens.id_token, "POST", env);
}

export async function interceptPage(apiKey, tokens, itemCode, isEnterprise, env) {
  const path = "api/v8/xl-stores/options/search/intercept-page";
  const payload = { "item_code": itemCode, "is_enterprise": isEnterprise, "lang": "en" };
  return await sendApiRequest(apiKey, path, payload, tokens.id_token, "POST", env);
}</pre>