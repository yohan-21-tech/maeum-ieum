import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { secure, parseBody, fail, ok } from '@/lib/api';
import { currentUser, setSession, removeSession,checkOrigin } from '@/lib/auth';
import {consentSchema,consentRecord,demoEnabled} from '@/lib/security';
import { z } from 'zod';
import {allowRequest} from '@/lib/rate-limit';
import {createDemoPair,demoPairFor} from '@/lib/demo';
const registerSchema=z.object({name:z.string().trim().min(2).max(50),email:z.string().trim().email().max(254).transform(v=>v.toLowerCase()),password:z.string().min(8).max(72),role:z.enum(['teacher','parent']),consents:consentSchema}).strict();
const loginSchema=z.object({email:z.string().trim().email().max(254).transform(v=>v.toLowerCase()),password:z.string().min(1).max(72)}).strict();
export async function POST(req:NextRequest,{params}:{params:Promise<{action:string}>}) {
  if(!await checkOrigin(req))return fail('Origin check failed',403);
  const {action}=await params;const body=await parseBody(req);
  const ip=(req.headers.get('x-forwarded-for')||'').split(',')[0].trim()||'local';
  if(action!=='logout'&&!allowRequest(`auth:${action}:${action==='demo'?ip:String(body.email||'').toLowerCase().slice(0,254)}`,12))return fail('시도가 많습니다. 1분 후 다시 시도해 주세요.',429);
  if(action==='logout'){await removeSession();return ok({success:true});}
  if(action==='register'){
    const parsed=registerSchema.safeParse(body);if(!parsed.success)return fail('입력값과 필수 개인정보 동의를 확인해 주세요.');
    const {name,email,password,role,consents}=parsed.data;
    if(await db.user.findUnique({where:{email}}))return fail('이미 가입된 이메일입니다.',409);
    const passwordHash=await bcrypt.hash(password,12);
    const user=await db.$transaction(async tx=>{const u=await tx.user.create({data:{name,email,role,consentJson:JSON.stringify(consentRecord(consents)),passwordHash}});await tx.auditLog.create({data:{userId:u.id,action:'consent.recorded',detail:'2026-11-03'}});return u;});
    await setSession(user.id);return ok({success:true,role});
  }
  if(action==='login'){
    const parsed=loginSchema.safeParse(body);if(!parsed.success)return fail('이메일 또는 비밀번호가 올바르지 않습니다.',401);
    const user=await db.user.findUnique({where:{email:parsed.data.email}});
    if(!user||(user.isDemo&&!demoEnabled())||!await bcrypt.compare(parsed.data.password,user.passwordHash))return fail('이메일 또는 비밀번호가 올바르지 않습니다.',401);
    await setSession(user.id);return ok({success:true,role:user.role});
  }
  if(action==='demo'){
    if(!demoEnabled())return fail('데모가 비활성화되어 있습니다.',403);
    if(body.role!=='teacher'&&body.role!=='parent')return fail('유효하지 않은 역할입니다.');
    // 이미 체험 중이면 같은 짝 안에서 역할만 바꾸고, 처음이면 이 방문자만의 체험 계정을 새로 만든다.
    const current=await currentUser();const pair=current?.isDemo?demoPairFor(current.email):null;
    let user=pair?await db.user.findUnique({where:{email:body.role==='teacher'?pair.teacherEmail:pair.parentEmail}}):null;
    if(!user||!user.isDemo){
     if(!await db.caseLibrary.count())return fail('데모 사례 데이터가 없습니다. npm run db:seed를 실행하세요.',404);
     const created=await createDemoPair();user=body.role==='teacher'?created.teacher:created.parent;
    }
    await removeSession();await setSession(user.id);return ok({success:true,role:user.role});
  }
  return fail('존재하지 않는 인증 작업입니다.',404);
}
export async function GET(_:NextRequest,{params}:{params:Promise<{action:string}>}){
 const {action}=await params;if(action!=='me')return fail('존재하지 않는 경로입니다.',404);
 const user=await currentUser();return user?ok({user}):fail('로그인이 필요합니다.',401);
}
