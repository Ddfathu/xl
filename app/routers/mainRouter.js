// app/routers/mainRouter.js

import AuthInstance from '../service/auth.js';
import { handleRequestOtp, handleSubmitOtp, handleGetAccounts, handleSwitchAccount, handleDeleteAccount } from '../menus/account.js';
import { getFamilyPlanDashboard, executeChangeMember, executeRemoveMember, executeSetQuotaLimit } from '../menus/famplan.js';
import { purchaseByFamily, purchaseNTimes, purchaseNTimesByOptionCode } from '../menus/purchase.js';
import { showTransactionHistory } from '../menus/payment.js';

// ==========================================
// IMPORT MODUL BARU YANG LU KIRIM
// ==========================================
import { handleGetBookmarks, handleDeleteBookmark, handleSelectBookmark } from '../menus/bookmark.js';
import { handleGetHotMenu, handleInspectHot1, handleInspectHot2, handleExecuteHot2Payment } from '../menus/hot.js';
import { getStorePackages, getFamilyList } from '../client/store/search.js';
import { getRedeemables } from '../client/store/redeemables.js';
import { getSegments } from '../client/store/segments.js';

// Import client untuk menu-menu mandiri tambahan asli
import { validatePuk, dukcapil } from '../client/registration.js';
import { getGroupData, getGroupMembers, validateCircleMember, inviteCircleMember, removeCircleMember, createCircle, spendingTracker, getBonusData } from '../client/circle.js';
import { getProfile } from '../client/engsel.js';

export async function mainRouter(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Helper standar untuk response JSON + Headless CORS biar web lu ga kena CORS block
  const jsonResponse = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-target-number'
      }
    });
  };

  try {
    // =========================================================================
    // UI FRONTEND SEDERHANA UNTUK ROOT PATH (/)
    // =========================================================================
    if (path === "/" && method === "GET") {
      const htmlUi = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gateway Dashboard</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
    .card { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; }
    h2 { color: #333; margin-top: 0; }
    input { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box; font-size: 16px; }
    button { width: 100%; padding: 12px; background-color: #0056b3; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; transition: background 0.3s; }
    button:hover { background-color: #004494; }
    #msg { margin-top: 15px; font-size: 14px; color: #d9534f; word-break: break-all; }
    .success { color: #5cb85c !important; }
  </style>
</head>
<body>
  <div class="card">
    <h2>XL Bypass Login</h2>
    
    <div id="step-phone">
      <input type="text" id="phone" placeholder="Nomor HP (0819...)">
      <button onclick="reqOtp()">Kirim OTP</button>
    </div>

    <div id="step-otp" style="display: none;">
      <input type="text" id="otp" placeholder="Masukkan 6 Digit OTP">
      <button onclick="subOtp()">Login Sekarang</button>
    </div>

    <div id="msg"></div>
  </div>

  <script>
    async function reqOtp() {
      const phone = document.getElementById('phone').value;
      const msg = document.getElementById('msg');
      if(!phone) return msg.innerText = "Isi nomor HP dulu bos!";
      
      msg.innerText = "Mengirim permintaan OTP...";
      msg.className = "";
      
      try {
        const res = await fetch('/api/auth/request-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phone })
        });
        const data = await res.json();
        
        if(res.ok || data.status === "success" || data.status === "SUCCESS" || data.status === true) {
            msg.innerText = "OTP berhasil dikirim ke nomor lu!";
            msg.className = "success";
            document.getElementById('step-phone').style.display = 'none';
            document.getElementById('step-otp').style.display = 'block';
        } else {
            msg.innerText = "Gagal: " + JSON.stringify(data);
        }
      } catch (err) {
        msg.innerText = "Error jaringan: " + err.message;
      }
    }

    async function subOtp() {
      const phone = document.getElementById('phone').value;
      const otp = document.getElementById('otp').value;
      const msg = document.getElementById('msg');
      if(!otp) return msg.innerText = "Isi OTP dulu bos!";
      
      msg.innerText = "Memverifikasi OTP...";
      msg.className = "";
      
      try {
        const res = await fetch('/api/auth/submit-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phone, otp: otp })
        });
        const data = await res.json();
        
        if(res.ok || data.status === "success" || data.status === "SUCCESS" || data.status === true) {
            msg.innerText = "Login Berhasil! Session tersimpan di KV.";
            msg.className = "success";
            // Disini lu bisa nambahin redirect ke dashboard panel lu nanti
        } else {
            msg.innerText = "Gagal: " + JSON.stringify(data);
        }
      } catch (err) {
        msg.innerText = "Error jaringan: " + err.message;
      }
    }
  </script>
</body>
</html>`;
      return new Response(htmlUi, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }

    // =========================================================================
    // SECTION A: AUTHENTICATION & MANAGEMENT AKUN (Tanpa Cek Sesi)
    // =========================================================================
    if (path === "/api/auth/request-otp" && method === "POST") {
      const body = await request.json();
      return jsonResponse(await handleRequestOtp({ phoneNumber: body.phone_number, env }));
    }
    
    if (path === "/api/auth/submit-otp" && method === "POST") {
      const body = await request.json();
      return jsonResponse(await handleSubmitOtp({ phoneNumber: body.phone_number, otp: body.otp, env }));
    }

    if (path === "/api/accounts" && method === "GET") {
      return jsonResponse(await handleGetAccounts(env));
    }

    if (path === "/api/accounts/switch" && method === "POST") {
      const body = await request.json();
      return jsonResponse(await handleSwitchAccount({ targetNumber: body.number, env }));
    }

    if (path === "/api/accounts/delete" && method === "POST") {
      const body = await request.json();
      return jsonResponse(await handleDeleteAccount({ targetNumber: body.number, env }));
    }

    // Ambil sesi user aktif dari KV untuk endpoint yang wajib login
    const activeUser = await AuthInstance.getActiveUser(env);
    const apiKey = AuthInstance.apiKey;
    
    // =========================================================================
    // SECTION B: ENDPOINT MANAJEMEN BOOKMARK (BARU)
    // =========================================================================
    if (path === "/api/menu/bookmark/list" && method === "GET") {
      return jsonResponse(await handleGetBookmarks(env));
    }

    if (path === "/api/menu/bookmark/delete" && method === "POST") {
      const body = await request.json();
      return jsonResponse(await handleDeleteBookmark({
        familyCode: body.family_code,
        isEnterprise: body.is_enterprise,
        variantName: body.variant_name,
        order: body.order,
        env
      }));
    }

    if (path === "/api/menu/bookmark/inspect" && method === "POST") {
      const body = await request.json();
      return jsonResponse(await handleSelectBookmark({ bookmarkIdx: parseInt(body.bookmark_index, 10), env }));
    }

    // =========================================================================
    // SECTION C: ENDPOINT PAKET HOT & BYPASS PAYMENT BUNDLING (BARU)
    // =========================================================================
    if (path === "/api/menu/hot/list" && method === "GET") {
      return jsonResponse(await handleGetHotMenu(env));
    }

    if (path === "/api/menu/hot/inspect-1" && method === "POST") {
      if (!activeUser) return jsonResponse({ error: "Unauthorized" }, 401);
      const body = await request.json();
      return jsonResponse(await handleInspectHot1({ packageIdx: body.package_index, apiKey, tokens: activeUser.tokens, env }));
    }

    if (path === "/api/menu/hot/inspect-2" && method === "POST") {
      if (!activeUser) return jsonResponse({ error: "Unauthorized" }, 401);
      const body = await request.json();
      return jsonResponse(await handleInspectHot2({ packageIdx: body.package_index, apiKey, tokens: activeUser.tokens, env }));
    }

    if (path === "/api/menu/hot/execute-payment" && method === "POST") {
      if (!activeUser) return jsonResponse({ error: "Unauthorized" }, 401);
      const body = await request.json();
      return jsonResponse(await handleExecuteHot2Payment({
        methodType: body.method_type,
        paymentItems: body.payment_items,
        metaData: body.meta_data,
        walletMethod: body.wallet_method,
        walletNumber: body.wallet_number,
        apiKey,
        tokens: activeUser.tokens,
        env
      }));
    }

    // =========================================================================
    // SECTION D: ENDPOINT UTASAN STORE/KATALOG INTERNAL (BARU)
    // =========================================================================
    if (path === "/api/store/packages" && method === "POST") {
      if (!activeUser) return jsonResponse({ error: "Unauthorized" }, 401);
      const body = await request.json();
      return jsonResponse(await getStorePackages({ apiKey, tokens: activeUser.tokens, subsType: body.subs_type, isEnterprise: body.is_enterprise, env }));
    }

    if (path === "/api/store/family-list" && method === "POST") {
      if (!activeUser) return jsonResponse({ error: "Unauthorized" }, 401);
      const body = await request.json();
      return jsonResponse(await getFamilyList({ apiKey, tokens: activeUser.tokens, subsType: body.subs_type, isEnterprise: body.is_enterprise, env }));
    }

    if (path === "/api/store/redeemables" && method === "POST") {
      if (!activeUser) return jsonResponse({ error: "Unauthorized" }, 401);
      const body = await request.json();
      return jsonResponse(await getRedeemables({ apiKey, tokens: activeUser.tokens, isEnterprise: body.is_enterprise, env }));
    }

    if (path === "/api/store/segments" && method === "POST") {
      if (!activeUser) return jsonResponse({ error: "Unauthorized" }, 401);
      const body = await request.json();
      return jsonResponse(await getSegments({ apiKey, tokens: activeUser.tokens, isEnterprise: body.is_enterprise, env }));
    }

    // =========================================================================
    // SECTION E: TRANSAKSI PURCHASE UTAMA & FAMILY CODE
    // =========================================================================
    if (path === "/api/menu/purchase/family-code" && method === "POST") {
      if (!activeUser) return jsonResponse({ error: "Unauthorized" }, 401);
      const body = await request.json();
      return jsonResponse({
        status: "success",
        trigger_complete: await purchaseByFamily({
          familyCode: body.family_code,
          useDecoy: body.use_decoy ?? false,
          pauseOnSuccess: false,
          delaySeconds: body.delay_seconds || 0,
          startFromOption: body.start_from_option || 1,
          env
        })
      });
    }

    if (path === "/api/menu/purchase/n-times" && method === "POST") {
      if (!activeUser) return jsonResponse({ error: "Unauthorized" }, 401);
      const body = await request.json();
      return jsonResponse({
        status: "success",
        trigger_complete: await purchaseNTimes({
          n: parseInt(body.n, 10),
          familyCode: body.family_code,
          variantCode: body.variant_code,
          optionOrder: parseInt(body.option_order, 10),
          useDecoy: body.use_decoy ?? false,
          delaySeconds: body.delay_seconds || 0,
          pauseOnSuccess: false,
          tokenConfirmationIdx: body.token_confirmation_idx || 0,
          env
        })
      });
    }

    if (path === "/api/menu/purchase/n-times-option" && method === "POST") {
      if (!activeUser) return jsonResponse({ error: "Unauthorized" }, 401);
      const body = await request.json();
      return jsonResponse({
        status: "success",
        trigger_complete: await purchaseNTimesByOptionCode({
          n: parseInt(body.n, 10),
          optionCode: body.option_code,
          useDecoy: body.use_decoy ?? false,
          delaySeconds: body.delay_seconds || 0,
          pauseOnSuccess: false,
          tokenConfirmationIdx: body.token_confirmation_idx || 0,
          env
        })
      });
    }

    // =========================================================================
    // SECTION F: SISA LOGIC MENU UTAMA (Profile, Registrasi, Famplan, Circle)
    // =========================================================================
    if (path === "/api/menu/profile" && method === "GET") {
      if (!activeUser) return jsonResponse({ error: "Unauthorized" }, 401);
      return jsonResponse({ status: "success", data: await getProfile(apiKey, activeUser.tokens, env) });
    }

    if (path === "/api/menu/registration/dukcapil" && method === "POST") {
      const body = await request.json();
      return jsonResponse({ status: "success", data: await dukcapil(apiKey, body.msisdn, body.kk, body.nik, env) });
    }

    if (path === "/api/menu/registration/validate-puk" && method === "POST") {
      const body = await request.json();
      return jsonResponse({ status: "success", data: await validatePuk(apiKey, body.msisdn, body.puk, env) });
    }

    if (path === "/api/menu/famplan/dashboard" && method === "GET") {
      if (!activeUser) return jsonResponse({ error: "Unauthorized" }, 401);
      return jsonResponse(await getFamilyPlanDashboard(apiKey, activeUser.tokens, env));
    }

    if (path === "/api/menu/famplan/change-member" && method === "POST") {
      if (!activeUser) return jsonResponse({ error: "Unauthorized" }, 401);
      const body = await request.json();
      return jsonResponse(await executeChangeMember({ apiKey, tokens: activeUser.tokens, slotNumber: body.slot_number, targetMsisdn: body.target_msisdn, parentAlias: body.parent_alias, childAlias: body.child_alias, env }));
    }

    if (path === "/api/menu/famplan/remove-member" && method === "POST") {
      if (!activeUser) return jsonResponse({ error: "Unauthorized" }, 401);
      const body = await request.json();
      return jsonResponse(await executeRemoveMember({ apiKey, tokens: activeUser.tokens, slotNumber: body.slot_number, env }));
    }

    if (path === "/api/menu/famplan/set-limit" && method === "POST") {
      if (!activeUser) return jsonResponse({ error: "Unauthorized" }, 401);
      const body = await request.json();
      return jsonResponse(await executeSetQuotaLimit({ apiKey, tokens: activeUser.tokens, slotNumber: body.slot_number, newQuotaMb: body.new_quota_mb, env }));
    }

    if (path === "/api/menu/payment/history" && method === "GET") {
      if (!activeUser) return jsonResponse({ error: "Unauthorized" }, 401);
      return jsonResponse(await showTransactionHistory(apiKey, activeUser.tokens, env));
    }

    // --- Sub-Menu Circle ---
    if (path === "/api/menu/circle/status" && method === "GET") {
      if (!activeUser) return jsonResponse({ error: "Unauthorized" }, 401);
      return jsonResponse({ status: "success", data: await getGroupData(apiKey, activeUser.tokens, env) });
    }

    if (path === "/api/menu/circle/members" && method === "POST") {
      if (!activeUser) return jsonResponse({ error: "Unauthorized" }, 401);
      const body = await request.json();
      return jsonResponse({ status: "success", data: await getGroupMembers(apiKey, activeUser.tokens, body.group_id, env) });
    }

    if (path === "/api/menu/circle/validate" && method === "POST") {
      if (!activeUser) return jsonResponse({ error: "Unauthorized" }, 401);
      const body = await request.json();
      return jsonResponse({ status: "success", data: await validateCircleMember(apiKey, activeUser.tokens, body.msisdn, env) });
    }

    if (path === "/api/menu/circle/invite" && method === "POST") {
      if (!activeUser) return jsonResponse({ error: "Unauthorized" }, 401);
      const body = await request.json();
      return jsonResponse(await inviteCircleMember({ apiKey, tokens: activeUser.tokens, msisdn: body.msisdn, name: body.name, groupId: body.group_id, memberIdParent: body.member_id_parent, env }));
    }

    if (path === "/api/menu/circle/remove" && method === "POST") {
      if (!activeUser) return jsonResponse({ error: "Unauthorized" }, 401);
      const body = await request.json();
      return jsonResponse(await removeCircleMember({ apiKey, tokens: activeUser.tokens, memberId: body.member_id, groupId: body.group_id, memberIdParent: body.member_id_parent, isLastMember: body.is_last_member ?? false, env }));
    }

    if (path === "/api/menu/circle/create" && method === "POST") {
      if (!activeUser) return jsonResponse({ error: "Unauthorized" }, 401);
      const body = await request.json();
      return jsonResponse(await createCircle({ apiKey, tokens: activeUser.tokens, parentName: body.parent_name, groupName: body.group_name, memberMsisdn: body.member_msisdn, memberName: body.member_name, env }));
    }

    if (path === "/api/menu/circle/spending" && method === "POST") {
      if (!activeUser) return jsonResponse({ error: "Unauthorized" }, 401);
      const body = await request.json();
      return jsonResponse({ status: "success", data: await spendingTracker(apiKey, activeUser.tokens, body.parent_subs_id, body.family_id, env) });
    }

    if (path === "/api/menu/circle/bonus" && method === "POST") {
      if (!activeUser) return jsonResponse({ error: "Unauthorized" }, 401);
      const body = await request.json();
      return jsonResponse({ status: "success", data: await getBonusData(apiKey, activeUser.tokens, body.parent_subs_id, body.family_id, env) });
    }

    // Global 404 Route
    return jsonResponse({ error: `Route ${method} [${path}] tidak terdaftar di core backend.` }, 404);

  } catch (error) {
    console.error("[Router Catch Block Error]:", error);
    return jsonResponse({ error: "Terjadi kesalahan internal pada Router Pemeta Menu.", details: error.message }, 500);
  }
}
