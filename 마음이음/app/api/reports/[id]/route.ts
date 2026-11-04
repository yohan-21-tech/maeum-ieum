import{db}from'@/lib/db';import{secure,ok,fail,parseBody,sameUserReport,canEditReport,audit}from'@/lib/api';import{protect,reveal,safeJson}from'@/lib/crypto';
import{reportPatchSchema,parentReport}from'@/lib/security';
const serialize=(r:any)=>({...r,content:reveal(r.content),checklistJson:safeJson(r.checklistJson,[]),aiReportJson:safeJson(r.aiReportJson,{}),proposalsJson:safeJson(r.proposalsJson,[]),responses:r.responses?.map((x:any)=>({...x,content:reveal(x.content)})),escalations:r.escalations?.map((x:any)=>({...x,body:reveal(x.body)}))});
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){const a=await secure(req);if('error'in a)return a.error;const{id}=await params;
 const r=await db.report.findUnique({where:{id},include:{student:{select:{alias:true,classId:true}},responses:{include:{author:{select:{name:true,role:true}}},orderBy:{createdAt:'asc'}},escalations:true}});
 if(!r||!sameUserReport(r,a.user))return fail('리포트가 없거나 열람 권한이 없습니다.',404);
 await audit(a.user.id,'report.viewed',id);return ok({report:a.user.role==='parent'?parentReport(serialize(r)):serialize(r)});}
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){const a=await secure(req,['teacher']);if('error'in a)return a.error;const{id}=await params;
 const r=await db.report.findUnique({where:{id}});if(!r||!canEditReport(r,a.user))return fail('수정 권한이 없습니다.',403);
 const p=reportPatchSchema.safeParse(await parseBody(req));if(!p.success)return fail('리포트 입력 형식과 길이를 확인해 주세요.');const b=p.data;
 const {content,checklistJson,aiReportJson,proposalsJson,...fields}=b;
 const data={...fields,sharedWithParent:false,humanApprovedAt:null,
 ...(content!==undefined?{content:protect(content)}:{}),...(checklistJson?{checklistJson:protect(JSON.stringify(checklistJson))}:{}),
 ...(aiReportJson?{aiReportJson:protect(JSON.stringify(aiReportJson))}:{}),...(proposalsJson?{proposalsJson:protect(JSON.stringify(proposalsJson))}:{})};
 await db.$transaction(async tx=>{await tx.report.update({where:{id,teacherId:a.user.id},data});await tx.auditLog.create({data:{userId:a.user.id,action:'report.updated',detail:id}});});
 return ok({success:true,sharedWithParent:false,humanApprovedAt:null});}
