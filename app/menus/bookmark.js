<pre>// app/menus/bookmark.js
import { AuthInstance } from '../service/auth.js';
import { BookmarkInstance } from '../service/bookmark.js';
import { getFamily } from '../client/engsel.js';
import { showPackageDetails } from './package.js';

export async function handleGetBookmarks(env) {
  const bookmarks = await BookmarkInstance.getBookmarks(env);
  if (!bookmarks || bookmarks.length === 0) {
    return { status: "success", bookmarks: [], message: "Tidak ada bookmark tersimpan." };
  }
  return { status: "success", bookmarks };
}

export async function handleDeleteBookmark({ familyCode, isEnterprise, variantName, order, env }) {
  try {
    await BookmarkInstance.removeBookmark(familyCode, isEnterprise, variantName, order, env);
    return { status: "success", message: "Bookmark berhasil dihapus." };
  } catch (error) {
    return { status: "error", message: `Gagal menghapus bookmark: ${error.message}` };
  }
}

export async function handleSelectBookmark({ bookmarkIdx, env }) {
  const activeUser = await AuthInstance.getActiveUser(env);
  if (!activeUser) {
    return { status: "error", message: "Unauthorized. Silakan login terlebih dahulu." };
  }

  const apiKey = AuthInstance.apiKey;
  const tokens = activeUser.tokens;

  const bookmarks = await BookmarkInstance.getBookmarks(env);
  if (!bookmarks || bookmarkIdx < 0 || bookmarkIdx >= bookmarks.length) {
    return { status: "error", message: "Indeks bookmark tidak valid." };
  }

  const selectedBm = bookmarks[bookmarkIdx];
  const familyCode = selectedBm.family_code;
  const isEnterprise = selectedBm.is_enterprise;

  console.log(`Mengambil data family untuk code: ${familyCode}`);
  const familyData = await getFamily(apiKey, tokens, familyCode, isEnterprise, env);
  if (!familyData) {
    return { status: "error", message: "Gagal mengambil data family dari server." };
  }

  const packageVariants = familyData.package_variants || [];
  let optionCode = null;

  for (const variant of packageVariants) {
    if (variant.name === selectedBm.variant_name) {
      const packageOptions = variant.package_options || [];
      for (const option of packageOptions) {
        if (option.order === selectedBm.order) {
          optionCode = option.package_option_code;
          break;
        }
      }
    }
  }

  if (!optionCode) {
    return { status: "error", message: "Option code tidak ditemukan di dalam package variants terbaru." };
  }

  const packageDetails = await showPackageDetails(apiKey, tokens, optionCode, isEnterprise, env);
  
  return {
    status: "success",
    option_code: optionCode,
    package_details: packageDetails
  };
}</pre>