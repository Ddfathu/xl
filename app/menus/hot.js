<pre>// app/menus/hot.js
import { getFamily, getPackageDetails } from '../client/engsel.js';
import { showPackageDetails } from './package.js';
import { settlementBalance } from '../client/purchase/balance.js';
import { executeEwalletPurchase } from '../client/purchase/ewallet.js';
import { executeQrisPurchase } from '../client/purchase/qris.js';
import { displayHtml, formatQuotaByte } from './util.js'; 

async function loadHotPackagesFromKV(hotKey, env) {
  const kv = env.TOKENS_KV;
  if (!kv) return [];
  const data = await kv.get(hotKey);
  try {
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error(`Error parsing ${hotKey}:`, e);
    return [];
  }
}

export async function handleGetHotMenu(env) {
  const packages = await loadHotPackagesFromKV("hot_packages", env);
  return { status: "success", type: "HOT_1", data: packages };
}

export async function handleInspectHot1({ packageIdx, apiKey, tokens, env }) {
  const hotPackages = await loadHotPackagesFromKV("hot_packages", env);
  if (packageIdx < 0 || packageIdx >= hotPackages.length) {
    return { status: "error", message: "Indeks paket tidak valid." };
  }

  const selected = hotPackages[packageIdx];
  const familyData = await getFamily(apiKey, tokens, selected.family_code, selected.is_enterprise, env);
  if (!familyData) return { status: "error", message: "Gagal mengambil data family." };

  const packageVariants = familyData.package_variants || [];
  let optionCode = null;

  for (const variant of packageVariants) {
    if (variant.name === selected.variant_name) {
      const packageOptions = variant.package_options || [];
      for (const option of packageOptions) {
        if (option.order === selected.order) {
          optionCode = option.package_option_code;
          break;
        }
      }
    }
  }

  if (!optionCode) return { status: "error", message: "Option code tidak ditemukan." };
  
  const details = await showPackageDetails(apiKey, tokens, optionCode, selected.is_enterprise, env);
  return { status: "success", option_code: optionCode, details };
}

export async function handleInspectHot2({ packageIdx, apiKey, tokens, env }) {
  const hotPackages = await loadHotPackagesFromKV("hot2_packages", env);
  if (packageIdx < 0 || packageIdx >= hotPackages.length) {
    return { status: "error", message: "Indeks paket tidak valid." };
  }

  const selectedPackage = hotPackages[packageIdx];
  const packages = selectedPackage.packages || [];
  if (packages.length === 0) return { status: "error", message: "Paket tidak tersedia." };

  const paymentItems = [];
  let mainPackageDetail = null;

  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];
    const packageDetail = await getPackageDetails(
      apiKey,
      tokens,
      pkg.family_code,
      pkg.variant_code,
      pkg.order,
      pkg.is_enterprise,
      pkg.migration_type,
      env
    );

    if (!packageDetail) {
      return { status: "error", message: `Gagal mengambil detail paket untuk ${pkg.family_code}.` };
    }

    if (i === 0) mainPackageDetail = packageDetail;

    paymentItems.push({
      item_code: packageDetail.package_option.package_option_code,
      product_type: "",
      item_price: packageDetail.package_option.price,
      item_name: packageDetail.package_option.name,
      tax: 0,
      token_confirmation: packageDetail.token_confirmation,
    });
  }

  const opt = mainPackageDetail.package_option || {};
  const fam = mainPackageDetail.package_family || {};
  const title = `${fam.name || ""} - ${mainPackageDetail.package_detail_variant?.name || ""} - ${opt.name || ""}`.trim();
  
  const formattedBenefits = (opt.benefits || []).map(b => {
    let totalFormatted = `${b.total} (${b.data_type})`;
    if (b.data_type === "VOICE" && b.total > 0) totalFormatted = `${b.total / 60} menit`;
    if (b.data_type === "TEXT" && b.total > 0) totalFormatted = `${b.total} SMS`;
    if (b.data_type === "DATA" && b.total > 0) totalFormatted = formatQuotaByte(Number(b.total));
    return { name: b.name, item_id: b.item_id, total: totalFormatted, unlimited: b.is_unlimited };
  });

  return {
    status: "success",
    meta: {
      name: selectedPackage.name,
      price: selectedPackage.price,
      detail: selectedPackage.detail,
      payment_for: selectedPackage.payment_for || "BUY_PACKAGE",
      ask_overwrite: selectedPackage.ask_overwrite || false,
      overwrite_amount: selectedPackage.overwrite_amount ?? -1,
      token_confirmation_idx: selectedPackage.token_confirmation_idx || 0,
      amount_idx: selectedPackage.amount_idx ?? -1
    },
    main_package: {
      nama: title,
      harga: opt.price,
      payment_for: fam.payment_for,
      masa_aktif: opt.validity,
      point: opt.point,
      plan_type: fam.plan_type,
      family_code: fam.package_family_code,
      parent_code: mainPackageDetail.package_addon?.parent_code || "N/A",
      snk: displayHtml(opt.tnc),
      benefits: formattedBenefits
    },
    payment_items: paymentItems
  };
}

export async function handleExecuteHot2Payment({
  methodType, 
  paymentItems,
  metaData,
  walletMethod = "", 
  walletNumber = "", 
  apiKey,
  tokens,
  env
}) {
  const paymentFor = metaData.payment_for;
  const askOverwrite = metaData.ask_overwrite;
  const overwriteAmount = metaData.overwrite_amount;
  const tokenConfirmationIdx = metaData.token_confirmation_idx;
  const amountIdx = metaData.amount_idx;

  if (methodType === "1") {
    const res = await settlementBalance({
      apiKey,
      tokens,
      items: paymentItems,
      paymentFor,
      overwriteAmount,
      tokenConfirmationIdx,
      amountIdx,
      env
    });
    return { status: "success", gateway: "BALANCE", result: res };
  }

  if (methodType === "2") {
    const res = await executeEwalletPurchase({
      apiKey,
      tokens,
      items: paymentItems,
      paymentMethod: walletMethod,
      walletNumber,
      paymentFor,
      overwriteAmount,
      tokenConfirmationIdx,
      amountIdx,
      env
    });
    return res;
  }

  if (methodType === "3") {
    const res = await executeQrisPurchase({
      apiKey,
      tokens,
      items: paymentItems,
      paymentFor,
      overwriteAmount,
      tokenConfirmationIdx,
      amountIdx,
      env
    });
    return res;
  }

  return { status: "error", message: "Metode pembayaran tidak dikenali." };
}</pre>