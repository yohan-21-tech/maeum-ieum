import { cookies } from 'next/headers';
import {validAiConsent} from './security';
import { redirect } from 'next/navigation';
import { createHash, randomBytes } from 'crypto';
import { db } from './db';
export const COOKIE = 'maeum_session';
export const sha = (v: string) => createHash('sha256').update(v).digest('hex');
export type Principal = { id: string; name: string; role: 'teacher' | 'parent'; email: string; consentJson: string; isDemo: boolean; availableStart: string; availableEnd: string; filterStrength: string };
export async function currentUser(): Promise<Principal | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;
  const s = await db.session.findUnique({where: {tokenHash: sha(token)}, include: {user: true}});
  if (!s || s.expiresAt.getTime() < Date.now()) return null;
  const u = s.user;
  if (u.role !== 'teacher' && u.role !== 'parent') return null;
  return {id:u.id,name:u.name,role:u.role,email:u.email,consentJson:u.consentJson,isDemo:u.isDemo,availableStart:u.availableStart,availableEnd:u.availableEnd,filterStrength:u.filterStrength};
}
export async function requirePageUser() {
  const u = await currentUser();
  if (!u) redirect('/login');
  return u;
}
export async function setSession(userId: string) {
  const token = randomBytes(32).toString('base64url');
  await db.session.create({data:{userId,tokenHash:sha(token),expiresAt:new Date(Date.now()+7*86400000)}});
  (await cookies()).set(COOKIE,token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:604800});
}
export async function removeSession() {
  const store=await cookies(); const token=store.get(COOKIE)?.value;
  if(token) await db.session.deleteMany({where:{tokenHash:sha(token)}});
  store.delete(COOKIE);
}
export function hasAiConsent(u:Principal){
  return validAiConsent(u.consentJson);
}
export async function checkOrigin(request: Request) {
  if (['GET','HEAD','OPTIONS'].includes(request.method)) return true;
  const origin=request.headers.get('origin');
  if (!origin) return false;
  try{const url=new URL(request.url);const expected=process.env.APP_ORIGIN||`${url.protocol}//${request.headers.get('host')||url.host}`;return new URL(origin).origin===new URL(expected).origin;}catch{return false;}
}
