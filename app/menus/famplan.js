<pre>// app/menus/famplan.js
import { getDashboard, changeMember, removeMember, setQuotaLimit } from '../client/engsel.js';

export async function getFamilyPlanDashboard(apiKey, tokens, env) {
  console.log("[Famplan Menu] Fetching family dashboard...");
  const res = await getDashboard(apiKey, tokens, env);
  if (!res || res.status !== "SUCCESS") {
    return { status: "error", message: "Gagal menarik data dashboard Akrab.", details: res };
  }
  return { status: "success", dashboard: res.data };
}

export async function executeChangeMember({ apiKey, tokens, slotNumber, targetMsisdn, parentAlias, childAlias, env }) {
  console.log(`[Famplan Menu] Changing member slot ${slotNumber} to ${targetMsisdn}...`);
  const res = await changeMember(apiKey, tokens, slotNumber, targetMsisdn, parentAlias, childAlias, env);
  return res;
}

export async function executeRemoveMember({ apiKey, tokens, slotNumber, env }) {
  console.log(`[Famplan Menu] Removing member from slot ${slotNumber}...`);
  const res = await removeMember(apiKey, tokens, slotNumber, env);
  return res;
}

export async function executeSetQuotaLimit({ apiKey, tokens, slotNumber, newQuotaMb, env }) {
  console.log(`[Famplan Menu] Setting quota limit for slot ${slotNumber} to ${newQuotaMb}MB...`);
  const res = await setQuotaLimit(apiKey, tokens, slotNumber, newQuotaMb, env);
  return res;
}</pre>