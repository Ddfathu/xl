<pre>// app/client/encrypt.js

/**
 * Encrypts and signs raw payload using Web Crypto API inside Cloudflare Workers
 */
export async function encryptsignXdata(apiKey, method, path, token, payload, env) {
  const xtime = Date.now();
  const rawBody = JSON.stringify(payload);
  
  // mock/dummy internal crypto payload logic to suit the telco payload signature structure
  // implementation depends on the client-specific public key injection or XOR mask
  const encryptedString = btoa(encodeURIComponent(rawBody)); 
  
  const signaturePayload = `${method.toUpperCase()}:${path}:${xtime}:${token || ''}:${encryptedString}`;
  const encoder = new TextEncoder();
  const dataToSign = encoder.encode(signaturePayload);
  
  // Simple HMAC/SHA256 structure variant using Web Crypto API
  const mockKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(apiKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", mockKey, dataToSign);
  const sigArray = Array.from(new Uint8Array(sigBuffer));
  const signatureHex = sigArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    signature: signatureHex,
    encrypted_body: {
      xtime: String(xtime),
      xdata: encryptedString
    }
  };
}

/**
 * Decrypts server response payload
 */
export async function decryptXdata(apiKey, jsonResponse, env) {
  if (!jsonResponse || !jsonResponse.xdata) {
    return jsonResponse;
  }
  try {
    const decoded = decodeURIComponent(atob(jsonResponse.xdata));
    return JSON.parse(decoded);
  } catch (e) {
    console.error("[Decrypt Error] Gagal melakukan parsing xdata response.", e.message);
    return jsonResponse;
  }
}

/**
 * Generates custom timestamp format
 */
export function javaLikeTimestamp(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${ms}`;
}

/**
 * Creates dynamic X-Signature specific to multi-payment methods
 */
export async function getXSignaturePayment(apiKey, accessToken, ts, targets, tokenPayment, method, paymentFor, path, env) {
  const encoder = new TextEncoder();
  const rawString = `${accessToken}:${ts}:${targets}:${tokenPayment}:${method}:${paymentFor}:${path}`;
  
  const mockKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(apiKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const sigBuffer = await crypto.subtle.sign("HMAC", mockKey, encoder.encode(rawString));
  const sigArray = Array.from(new Uint8Array(sigBuffer));
  return sigArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Standard dynamic field constructor for encrypted token metadata validation
 */
export function buildEncryptedField(isActive = true) {
  return isActive ? "ENG_ACTIVE_TRUE_" + btoa(String(Date.now())) : "";
}</pre>