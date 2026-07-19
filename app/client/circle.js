<pre>// app/client/circle.js
import { sendApiRequest } from './engsel.js';

export async function getGroupData(apiKey, tokens, env) {
  const path = "api/v8/circle/group-data";
  const payload = { "lang": "en" };
  return await sendApiRequest(apiKey, path, payload, tokens.id_token, "POST", env);
}

export async function getGroupMembers(apiKey, tokens, groupId, env) {
  const path = "api/v8/circle/group-members";
  const payload = { "group_id": groupId, "lang": "en" };
  return await sendApiRequest(apiKey, path, payload, tokens.id_token, "POST", env);
}

export async function validateCircleMember(apiKey, tokens, msisdn, env) {
  const path = "api/v8/circle/validate-member";
  const payload = { "msisdn": msisdn, "lang": "en" };
  return await sendApiRequest(apiKey, path, payload, tokens.id_token, "POST", env);
}

export async function inviteCircleMember({ apiKey, tokens, msisdn, name, groupId, memberIdParent, env }) {
  const path = "api/v8/circle/invite-member";
  const payload = { "msisdn": msisdn, "name": name, "group_id": groupId, "member_id_parent": memberIdParent, "lang": "en" };
  return await sendApiRequest(apiKey, path, payload, tokens.id_token, "POST", env);
}

export async function removeCircleMember({ apiKey, tokens, memberId, groupId, memberIdParent, isLastMember, env }) {
  const path = "api/v8/circle/remove-member";
  const payload = { "member_id": memberId, "group_id": groupId, "member_id_parent": memberIdParent, "is_last_member": isLastMember, "lang": "en" };
  return await sendApiRequest(apiKey, path, payload, tokens.id_token, "POST", env);
}

export async function createCircle({ apiKey, tokens, parentName, groupName, memberMsisdn, memberName, env }) {
  const path = "api/v8/circle/create";
  const payload = { "parent_name": parentName, "group_name": groupName, "member_msisdn": memberMsisdn, "member_name": memberName, "lang": "en" };
  return await sendApiRequest(apiKey, path, payload, tokens.id_token, "POST", env);
}

export async function spendingTracker(apiKey, tokens, parentSubsId, familyId, env) {
  const path = "api/v8/circle/spending-tracker";
  const payload = { "parent_subs_id": parentSubsId, "family_id": familyId, "lang": "en" };
  return await sendApiRequest(apiKey, path, payload, tokens.id_token, "POST", env);
}

export async function getBonusData(apiKey, tokens, parentSubsId, familyId, env) {
  const path = "api/v8/circle/bonus-data";
  const payload = { "parent_subs_id": parentSubsId, "family_id": familyId, "lang": "en" };
  return await sendApiRequest(apiKey, path, payload, tokens.id_token, "POST", env);
}</pre>