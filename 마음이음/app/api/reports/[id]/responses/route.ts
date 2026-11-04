import{db}from'@/lib/db';import{secure,ok,fail,parseBody,sameUserReport,audit}from'@/lib/api';import{protect}from'@/lib/crypto';
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){const a=await secure(req);if('error'in a)return a.error;const{id}=await params;
 const r=await db.report.findUnique({where:{id}});if(!r||!sameUserReport(r,a.user))return fail('리포트를 찾을 수 없습니다.',404);
 const b=await parseBody(req);if(!['agree','reject','revise'].includes(b.type)||typeof b.content!=='string'||b.content.length>6000)return fail('의견을 확인해 주세요.');
 await db.reportResponse.create({data:{reportId:id,authorId:a.user.id,type:b.type,content:protect(b.content)}});
 if(b.type!=='agree')await db.report.update({where:{id},data:{status:'reanalysis',step:2}});
 await audit(a.user.id,'report.responded',`${id}:${b.type}`);return ok({success:true},201);}
