import {NextRequest} from 'next/server';
import {z} from 'zod';
import {secure,ok,fail,parseBody} from '@/lib/api';
import {hasAiConsent} from '@/lib/auth';
import {chatbot,structureDiary,checklistFor,generateReport,alternativeSolutions,refineMessage,perspectiveOf,questionHelper} from '@/lib/ai';
import {analyzeEmotion} from '@/lib/emotion';
import {db} from '@/lib/db';
import {protect,reveal,safeJson} from '@/lib/crypto';
import {redactText,redactValue} from '@/lib/privacy';
import {evidenceRegistry,koreaDate} from '@/lib/laws';
import {allowRequest} from '@/lib/rate-limit';
export const maxDuration=60;
const inputSchema=z.object({text:z.string().trim().min(1).max(12000).optional(),content:z.string().trim().min(1).max(12000).optional(),query:z.string().trim().max(12000).optional(),checklist:z.array(z.object({id:z.string().max(100).optional(),question:z.string().max(2000),answer:z.string().max(4000),confirmed:z.boolean()})).max(50).optional()}).strict();
const feedbackSchema=z.object({messageId:z.string().min(1).max(100),rating:z.enum(['helpful','unhelpful']),reason:z.string().max(1000).optional(),editedText:z.string().trim().min(1).max(4000).optional()}).strict();
export async function POST(req:NextRequest,{params}:{params:Promise<{action:string}>}){
 const {action}=await params;const a=await secure(req);if('error'in a)return a.error;
 const body=await parseBody(req);
 if(action==='feedback'){
  const p=feedbackSchema.safeParse(body);if(!p.success)return fail('평가 입력값을 확인해 주세요.');
  const row=await db.chatMessage.findFirst({where:{id:p.data.messageId,userId:a.user.id,role:'assistant'}});
  if(!row)return fail('응답을 찾을 수 없습니다.',404);
  const result=safeJson<Record<string,unknown>>(row.responseJson,{});
  const feedback={...redactValue(p.data,[a.user.name]),updatedAt:new Date().toISOString()};
  await db.$transaction(async tx=>{await tx.chatMessage.update({where:{id:row.id,userId:a.user.id},data:{responseJson:protect(JSON.stringify({...result,feedback}))}});await tx.auditLog.create({data:{userId:a.user.id,action:'ai.feedback',detail:p.data.rating}});});
  return ok({success:true,feedback});
 }
 if(!['chat','structure','checklist','report','alternatives','refine','emotion','call-summary','perspective','questions'].includes(action))return fail('존재하지 않는 AI 작업입니다.',404);
 if(!hasAiConsent(a.user))return fail('내 정보에서 현재 버전의 대화·감정·AI 처리 동의를 저장해 주세요.',403);
 if(['structure','checklist','report','alternatives','call-summary'].includes(action)&&a.user.role!=='teacher')return fail('교사 전용 기능입니다.',403);
 const parsed=inputSchema.safeParse(body);if(!parsed.success)return fail('입력 형식과 길이를 확인해 주세요.');
 const raw=parsed.data.text||parsed.data.content||parsed.data.query||'';
 if(raw.includes('\uFFFD'))return fail('글자가 깨져서 전송되었습니다. 브라우저에서 다시 입력해 주세요.');
 if(!raw.trim()||(action==='chat'&&raw.length>4000))return fail('내용을 입력해 주세요. 질문은 최대 4,000자입니다.');
 if(!allowRequest(`ai:${a.user.id}`,20))return fail('요청이 많습니다. 잠시 후 다시 시도해 주세요.',429);
 // 서버가 여러 대로 나뉘는 Vercel에서도 지켜지도록, 최근 1분간 AI 사용 기록으로 한 번 더 제한한다.
 const recent=await db.auditLog.count({where:{userId:a.user.id,action:{startsWith:'ai.'},createdAt:{gte:new Date(Date.now()-60_000)}}});
 if(recent>=20)return fail('요청이 많습니다. 1분 뒤 다시 시도해 주세요.',429);
 const students=await db.student.findMany({where:a.user.role==='teacher'?{teacherId:a.user.id}:{parentId:a.user.id},select:{alias:true,parent:{select:{name:true}},teacher:{select:{name:true}}}});
 const names=[a.user.name,...students.flatMap(s=>[s.alias,s.parent?.name||'',s.teacher.name])];
 const text=redactText(raw,names);const checklist=redactValue(parsed.data.checklist||[],names);
 try{
  let result:unknown;
  if(action==='chat')result=await chatbot(text,a.user);
  if(action==='structure')result=await structureDiary(text);
  if(action==='checklist')result=await checklistFor(text);
  if(action==='report')result=await generateReport(text,checklist);
  if(action==='alternatives')result={proposals:await alternativeSolutions(text)};
  if(action==='refine')result=await refineMessage(text);
  if(action==='emotion')result=analyzeEmotion(text,a.user.filterStrength as 'weak'|'normal'|'strong');
  if(action==='call-summary')result=await structureDiary(text);
  if(action==='perspective')result=await perspectiveOf(text,a.user.role);
  if(action==='questions')result=await questionHelper(text,a.user.role);
  const latest=await db.user.findUnique({where:{id:a.user.id},select:{consentJson:true}});
  if(!latest||latest.consentJson!==a.user.consentJson)return fail('처리 중 동의가 변경되었습니다. 결과를 저장하지 않았습니다.',409);
  let messageId:string|undefined;let diaryId:string|undefined;
  await db.$transaction(async tx=>{
   const consent=await tx.user.findUniqueOrThrow({where:{id:a.user.id},select:{consentJson:true}});
   if(consent.consentJson!==a.user.consentJson)throw new Error('consent-changed');
   if(action==='chat'){
    const chat=result as Awaited<ReturnType<typeof chatbot>>;
    await tx.chatMessage.create({data:{userId:a.user.id,role:'user',content:protect(text)}});
    const message=await tx.chatMessage.create({data:{userId:a.user.id,role:'assistant',content:protect(chat.text),responseJson:protect(JSON.stringify(chat))}});messageId=message.id;
   }
   if(action==='call-summary'){
    const student=await tx.student.findFirst({where:{teacherId:a.user.id}});if(!student)throw new Error('missing-student');
    const summary=result as Awaited<ReturnType<typeof structureDiary>>;
    const diary=await tx.diaryEntry.create({data:{teacherId:a.user.id,studentId:student.id,date:new Date(),tags:protect(JSON.stringify(['상담','모의통화'])),content:protect(`모의 통화 기록 (실제 통화 아님)\n${text}`),aiSummary:protect(summary.summary)}});diaryId=diary.id;
   }
   await tx.auditLog.create({data:{userId:a.user.id,action:`ai.${action}`,detail:action==='chat'?JSON.stringify({messageId,mode:(result as {mode:string}).mode}):undefined}});
  });
  return ok({...result as object,...(messageId?{messageId}:{}),...(diaryId?{success:true,diaryId}:{})});
 }catch{return fail('AI 처리 또는 저장에 실패했습니다. 입력 내용을 보관하고 재시도해 주세요.',503);}
}
export async function GET(req:NextRequest,{params}:{params:Promise<{action:string}>}){
 const {action}=await params;const a=await secure(req);if('error'in a)return a.error;
 if(action==='evidence')return ok({asOf:koreaDate(),sources:evidenceRegistry(),coverage:'검증한 일부 조문·공식 설명 사례만 포함. 학교별 규정·일정 미등록.'});
 if(action==='history'){
  const rows=await db.chatMessage.findMany({where:{userId:a.user.id},orderBy:{createdAt:'desc'},take:20});
  return ok({messages:rows.reverse().map(m=>({id:m.id,role:m.role,content:reveal(m.content),responseJson:safeJson(m.responseJson,null)}))});
 }
 if(action==='evaluation'){
  const rows=await db.chatMessage.findMany({where:{userId:a.user.id,role:'assistant'},orderBy:{createdAt:'desc'},take:200});
  const results=rows.map(m=>safeJson<any>(m.responseJson,{}));
  return ok({sampleSize:results.length,helpful:results.filter(r=>r.feedback?.rating==='helpful').length,unhelpful:results.filter(r=>r.feedback?.rating==='unhelpful').length,withOfficialEvidence:results.filter(r=>r.sources?.some((s:any)=>s.publisher)).length,fallback:results.filter(r=>r.mode==='fallback').length,notice:'내 계정 최근 200개 응답의 사용성 지표이며 법률 정확도가 아닙니다.'});
 }
 return fail('존재하지 않는 AI 작업입니다.',404);
}
