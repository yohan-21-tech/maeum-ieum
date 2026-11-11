import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { secure, parseBody, fail, ok } from '@/lib/api';
import { currentUser, setSession, removeSession,checkOrigin } from '@/lib/auth';
import {consentSchema,consentRecord,demoEnabled} from '@/lib/security';
import { z } from 'zod';
import {allowRequest} from '@/lib/rate-limit';
import {createDemoPair,demoPairFor} from '@/lib/demo';
import {generateRecoveryCode,hashRecoveryCode,recoveryCodeMatches} from '@/lib/recovery';
const registerSchema=z.object({name:z.string().trim().min(2).max(50),email:z.string().trim().email().max(254).transform(v=>v.toLowerCase()),password:z.string().min(8).max(72),role:z.enum(['teacher','parent']),consents:consentSchema}).strict();
const resetSchema=z.object({email:z.string().trim().email().max(254).transform(v=>v.toLowerCase()),recoveryCode:z.string().trim().min(16).max(40),newPassword:z.string().min(8).max(72)}).strict();
const reissueSchema=z.object({password:z.string().min(1).max(72)}).strict();
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
    const passwordHash=await bcrypt.hash(password,12);const recoveryCode=generateRecoveryCode();
    const user=await db.$transaction(async tx=>{const u=await tx.user.create({data:{name,email,role,consentJson:JSON.stringify(consentRecord(consents)),passwordHash,recoveryCodeHash:hashRecoveryCode(recoveryCode)}});await tx.auditLog.create({data:{userId:u.id,action:'consent.recorded',detail:'2026-11-03'}});return u;});
    // 복구 코드는 이 응답에서 한 번만 보여준다. 서버에는 해시만 남는다.
    await setSession(user.id);return ok({success:true,role,recoveryCode});
  }
  if(action==='reset'){
    // 비밀번호 찾기: 이메일 + 복구 코드로 새 비밀번호를 정한다. 성공하면 다른 기기 로그인은 모두 끊고 새 복구 코드를 준다.
    if(!allowRequest(`auth:reset-ip:${ip}`,10))return fail('시도가 많습니다. 1분 후 다시 시도해 주세요.',429);
    const parsed=resetSchema.safeParse(body);if(!parsed.success)return fail('이메일, 복구 코드, 새 비밀번호(8자 이상)를 확인해 주세요.');
    const wrong=()=>fail('이메일 또는 복구 코드가 올바르지 않습니다.',400);
    const user=await db.user.findUnique({where:{email:parsed.data.email}});
    if(!user||user.isDemo)return wrong();
    const recentFails=await db.auditLog.count({where:{userId:user.id,action:'auth.reset-failed',createdAt:{gte:new Date(Date.now()-15*60_000)}}});
    if(recentFails>=5)return fail('복구 코드를 여러 번 틀렸습니다. 15분 후 다시 시도해 주세요.',429);
    if(!recoveryCodeMatches(parsed.data.recoveryCode,user.recoveryCodeHash)){await db.auditLog.create({data:{userId:user.id,action:'auth.reset-failed'}});return wrong();}
    const recoveryCode=generateRecoveryCode();const passwordHash=await bcrypt.hash(parsed.data.newPassword,12);
    await db.$transaction([
     db.user.update({where:{id:user.id},data:{passwordHash,recoveryCodeHash:hashRecoveryCode(recoveryCode)}}),
     db.session.deleteMany({where:{userId:user.id}}),
     db.auditLog.create({data:{userId:user.id,action:'auth.password-reset'}})
    ]);
    await removeSession();await setSession(user.id);return ok({success:true,role:user.role,recoveryCode});
  }
  if(action==='recovery-code'){
    // 로그인한 사용자가 현재 비밀번호를 확인한 뒤 복구 코드를 새로 받는다 (이전 코드는 무효).
    const me=await currentUser();if(!me)return fail('로그인이 필요합니다.',401);
    if(me.isDemo)return fail('체험 계정에서는 복구 코드를 발급하지 않습니다.',403);
    const parsed=reissueSchema.safeParse(body);if(!parsed.success)return fail('현재 비밀번호를 입력해 주세요.');
    const user=await db.user.findUnique({where:{id:me.id}});
    if(!user||!await bcrypt.compare(parsed.data.password,user.passwordHash))return fail('현재 비밀번호가 올바르지 않습니다.',400);
    const recoveryCode=generateRecoveryCode();
    await db.$transaction([db.user.update({where:{id:me.id},data:{recoveryCodeHash:hashRecoveryCode(recoveryCode)}}),db.auditLog.create({data:{userId:me.id,action:'auth.recovery-code-issued'}})]);
    return ok({success:true,recoveryCode});
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
 const {action}=await params;
 // 화면이 체험(데모) 메뉴를 보여줄지 정할 수 있도록, 로그인 없이 운영 모드만 알려준다.
 if(action==='config')return ok({demo:demoEnabled()});
 if(action!=='me')return fail('존재하지 않는 경로입니다.',404);
 const user=await currentUser();if(!user)return fail('로그인이 필요합니다.',401);
 const row=await db.user.findUnique({where:{id:user.id},select:{recoveryCodeHash:true}});
 return ok({user,demo:demoEnabled(),hasRecoveryCode:!!row?.recoveryCodeHash});
}
