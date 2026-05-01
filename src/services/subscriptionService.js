import { obtenirUtilisateurActuel } from './authService';
import { ensureSubscriptionForUser, getSubscriptionByUserId, requestActivationForUser } from './databaseService';

function isEndsAtInFuture(endsAt) {
  if (!endsAt) return true;
  const d = new Date(endsAt);
  if (Number.isNaN(d.getTime())) return true;
  return d.getTime() > Date.now();
}

export async function getSubscriptionStatusForCurrentUser() {
  const user = await obtenirUtilisateurActuel();
  if (!user?.id) return { status: 'unknown', plan: 'free' };

  await ensureSubscriptionForUser(user.id);
  const res = await getSubscriptionByUserId(user.id);
  if (!res.success) return { status: 'unknown', plan: 'free' };
  const sub = res.data;
  if (!sub) return { status: 'pending', plan: 'free' };

  const effectiveStatus =
    sub.status === 'active' && !isEndsAtInFuture(sub.endsAt) ? 'expired' : sub.status;
  return { status: effectiveStatus, plan: sub.plan, endsAt: sub.endsAt };
}

export async function ensureActivationRequest() {
  const user = await obtenirUtilisateurActuel();
  if (!user?.id) return { success: false, error: 'Not logged in' };
  return await requestActivationForUser(user.id);
}

