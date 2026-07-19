<pre>// app/client/purchase/balance.js
import { sendApiRequest } from '../engsel.js';

export async function settlementBalance({ apiKey, tokens, items, paymentFor = "BUY_PACKAGE", overwriteAmount = -1, tokenConfirmationIdx = 0, amountIdx = -1, env }) {
  const path = "api/v8/payments/settlement";
  const payload = {
    "payment_method": "BALANCE",
    "items": items,
    "payment_for": paymentFor,
    "lang": "en"
  };
  
  if (overwriteAmount !== -1 && items.length > 0) {
    items[amountIdx !== -1 ? amountIdx : 0].item_price = overwriteAmount;
  }
  
  const res = await sendApiRequest(apiKey, path, payload, tokens.id_token, "POST", env);
  return res;
}</pre>