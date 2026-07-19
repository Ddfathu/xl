<pre>// app/menus/account.js
import { requestOtp, submitOtp, getProfile } from '../client/engsel.js';
import { AuthInstance } from '../service/auth.js';

export async function handleRequestOtp({ phoneNumber, env }) {
  const apiKey = AuthInstance.apiKey;
  console.log(`[Account Menu] Requesting OTP for ${phoneNumber}...`);
  const res = await requestOtp(apiKey, phoneNumber, env);
  return res;
}

export async function handleSubmitOtp({ phoneNumber, otp, env }) {
  const apiKey = AuthInstance.apiKey;
  console.log(`[Account Menu] Submitting OTP for ${phoneNumber}...`);
  const res = await submitOtp(apiKey, phoneNumber, otp, env);
  
  if (res && res.status === "SUCCESS") {
    const tokens = {
      access_token: res.data.access_token,
      id_token: res.data.id_token,
      refresh_token: res.data.refresh_token
    };
    await AuthInstance.addUser({ phoneNumber, tokens, env });
    return { status: "success", message: "Login berhasil dan token disimpan di KV.", data: res.data };
  }
  return res;
}

export async function handleGetAccounts(env) {
  const users = await AuthInstance.getAllUsers();
  const activeUser = await AuthInstance.getActiveUser(env);
  
  const mapped = users.map(u => ({
    phone_number: u.phone_number,
    is_active: activeUser ? u.phone_number === activeUser.phone_number : false,
    updated_at: u.updated_at
  }));
  
  return { status: "success", accounts: mapped };
}

export async function handleSwitchAccount({ targetNumber, env }) {
  await AuthInstance.init(env);
  const user = AuthInstance.users.find(u => u.phone_number === targetNumber);
  if (!user) {
    return { status: "error", message: "Nomor tidak ditemukan di dalam database lokal." };
  }
  
  AuthInstance.users.forEach(u => u.is_active = (u.phone_number === targetNumber));
  await AuthInstance.saveState(env);
  return { status: "success", message: `Berhasil beralih ke akun aktif nomor: ${targetNumber}` };
}

export async function handleDeleteAccount({ targetNumber, env }) {
  await AuthInstance.removeUser(targetNumber, env);
  return { status: "success", message: `Akun nomor ${targetNumber} berhasil dihapus dari KV.` };
}</pre>