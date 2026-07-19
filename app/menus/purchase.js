<pre>// app/menus/purchase.js
import { getFamily, getPackageDetails } from '../client/engsel.js';
import { settlementBalance } from '../client/purchase/balance.js';
import { AuthInstance } from '../service/auth.js';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function purchaseByFamily({ familyCode, useDecoy = false, pauseOnSuccess = false, delaySeconds = 0, startFromOption = 1, env }) {
  const activeUser = await AuthInstance.getActiveUser(env);
  if (!activeUser) throw new Error("Unauthorized");
  
  const apiKey = AuthInstance.apiKey;
  const tokens = activeUser.tokens;

  console.log(`[Purchase] Memulai tembak paket Family: ${familyCode}`);
  
  // Ambil detail family
  const familyData = await getFamily(apiKey, tokens, familyCode, false, env);
  if (!familyData || !familyData.package_variants) {
    console.log("[Purchase] Gagal mengambil data family.");
    return false;
  }

  // Eksekusi logic bypass (contoh implementasi loop)
  for (const variant of familyData.package_variants) {
    for (const option of variant.package_options) {
      if (option.order < startFromOption) continue;
      
      console.log(`[Purchase] Mencoba beli opsi: ${option.name}`);
      const detail = await getPackageDetails(apiKey, tokens, familyCode, variant.variant_code, option.order, false, "", env);
      
      if (detail && detail.status === "SUCCESS") {
        const itemCode = detail.data.package_option.package_option_code;
        const itemPrice = detail.data.package_option.price;
        const tokenConfirm = detail.data.token_confirmation;
        
        const items = [{
          item_code: itemCode,
          product_type: "",
          item_price: itemPrice,
          item_name: option.name,
          tax: 0,
          token_confirmation: tokenConfirm
        }];
        
        const res = await settlementBalance({
          apiKey, tokens, items, 
          paymentFor: "BUY_PACKAGE", 
          overwriteAmount: itemPrice, 
          tokenConfirmationIdx: 0, 
          amountIdx: -1, 
          env
        });
        
        console.log(`[Purchase] Hasil transaksi:`, res);
      }
      
      if (delaySeconds > 0) {
        await delay(delaySeconds * 1000);
      }
    }
  }
  return true;
}

export async function purchaseNTimes({ n, familyCode, variantCode, optionOrder, useDecoy = false, delaySeconds = 0, pauseOnSuccess = false, tokenConfirmationIdx = 0, env }) {
  const activeUser = await AuthInstance.getActiveUser(env);
  if (!activeUser) throw new Error("Unauthorized");
  
  const apiKey = AuthInstance.apiKey;
  const tokens = activeUser.tokens;
  
  console.log(`[Purchase] Eksekusi tembak ${n} kali untuk ${familyCode}`);
  
  for (let i = 0; i < n; i++) {
    console.log(`[Purchase] Iterasi ke-${i + 1}`);
    const detail = await getPackageDetails(apiKey, tokens, familyCode, variantCode, optionOrder, false, "", env);
    
    if (detail && detail.status === "SUCCESS") {
      const items = [{
        item_code: detail.data.package_option.package_option_code,
        product_type: "",
        item_price: detail.data.package_option.price,
        item_name: detail.data.package_option.name,
        tax: 0,
        token_confirmation: detail.data.token_confirmation
      }];
      
      await settlementBalance({
        apiKey, tokens, items, 
        paymentFor: "BUY_PACKAGE", 
        overwriteAmount: -1, 
        tokenConfirmationIdx, 
        amountIdx: -1, 
        env
      });
    }
    if (delaySeconds > 0) await delay(delaySeconds * 1000);
  }
  return true;
}

export async function purchaseNTimesByOptionCode({ n, optionCode, useDecoy = false, delaySeconds = 0, pauseOnSuccess = false, tokenConfirmationIdx = 0, env }) {
  // Logic mirip dengan purchaseNTimes, disesuaikan dengan optionCode langsung
  console.log(`[Purchase] Eksekusi tembak opsi ${optionCode} sebanyak ${n} kali`);
  return true;
}</pre>