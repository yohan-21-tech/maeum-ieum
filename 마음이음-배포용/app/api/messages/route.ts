import{db}from'@/lib/db';import{secure,ok,fail,parseBody,audit}from'@/lib/api';import{protect,reveal}from'@/lib/crypto';import{analyzeEmotion}from'@/lib/emotion';
import{messageSchema}from'@/lib/security';
export async function GET(req:Request){const a=await secure(req);if('error'in a)return a.error;
 const messages=await db.message.findMany({where:{OR:[{fromId:a.user.id},{toId:a.user.id}]},orderBy:{createdAt:'asc'},take:100,include:{from:{select:{name:true,role:true}},to:{select:{name:true,role:true}}}});
 return ok({messages:messages.map(m=>({...m,original:reveal(m.fromId===a.user.id?m.original:(m.refined||m.original)),refined:reveal(m.refined)}))});}
export async function POST(req:Request){const a=await secure(req);if('error'in a)return a.error;const p=messageSchema.safeParse(await parseBody(req));if(!p.success)return fail('내용을 검토하고 전송 확인을 선택해 주세요.');const b=p.data;
 const to=await db.user.findUnique({where:{id:String(b.toId||'')}});if(!to||to.role===a.user.role)return fail('올바른 상대방을 선택하세요.');
 if(typeof b.original!=='string'||!b.original.trim()||b.original.length>4000)return fail('메시지를 확인해 주세요.');
 if(b.original.includes('\uFFFD')||(typeof b.refined==='string'&&b.refined.includes('\uFFFD')))return fail('글자가 깨져서 전송되었습니다. 브라우저에서 다시 입력해 주세요.');
 const analysis=analyzeEmotion(b.refined||b.original,a.user.filterStrength as 'weak'|'normal'|'strong');
 if(analysis.warning!==Boolean(b.confirmedWarning)&&analysis.warning)return fail('경고 내용을 확인하고 전송 여부를 다시 선택하세요.',409);
 const related=await db.student.findFirst({where:a.user.role==='teacher'?{teacherId:a.user.id,parentId:to.id}:{parentId:a.user.id,teacherId:to.id}});
 if(!related)return fail('같은 학급·학생에 연결된 계정이 아닙니다.',403);
 const m=await db.$transaction(async tx=>{const row=await tx.message.create({data:{fromId:a.user.id,toId:to.id,original:protect(b.original),refined:typeof b.refined==='string'?protect(b.refined):null,emotionScore:analysis.score,warningFlag:analysis.warning,humanApprovedAt:new Date()}});await tx.auditLog.create({data:{userId:a.user.id,action:'message.sent',detail:row.id}});return row;});
 return ok({message:{id:m.id},analysis},201);}
