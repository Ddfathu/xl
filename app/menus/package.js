<pre>// app/menus/package.js
import { getPackageDetails } from '../client/engsel.js';
import { displayHtml, formatQuotaByte } from './util.js';

export async function showPackageDetails(apiKey, tokens, optionCode, isEnterprise, env) {
  // Option code usually embeds family code or variant info, but here we construct a simple fetch wrapper
  // Adapt mapping according to real response if needed
  const res = await getPackageDetails(apiKey, tokens, optionCode, optionCode, 1, isEnterprise, "", env);
  
  if (!res || res.status !== "SUCCESS") {
    return { status: "error", message: "Detail paket gagal dimuat." };
  }
  
  const opt = res.data?.package_option || {};
  return {
    status: "success",
    name: opt.name || "Unknown Package",
    price: opt.price || 0,
    validity: opt.validity || 0,
    point: opt.point || 0,
    description: displayHtml(opt.description || opt.tnc),
    benefits: (opt.benefits || []).map(b => ({
      name: b.name,
      total: b.data_type === "DATA" ? formatQuotaByte(Number(b.total)) : b.total
    }))
  };
}</pre>