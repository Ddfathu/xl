<pre>// app/client/registration.js
import { sendApiRequest } from './engsel.js';

export async function validatePuk(apiKey, msisdn, puk, env) {
  const path = "api/v5/registration/validate-puk";
  const payload = { "msisdn": msisdn, "puk": puk, "lang": "en" };
  return await sendApiRequest(apiKey, path, payload, null, "POST", env);
}

export async function dukcapil(apiKey, msisdn, kk, nik, env) {
  const path = "api/v5/registration/dukcapil";
  const payload = { "msisdn": msisdn, "kk": kk, "nik": nik, "lang": "en" };
  return await sendApiRequest(apiKey, path, payload, null, "POST", env);
}</pre>