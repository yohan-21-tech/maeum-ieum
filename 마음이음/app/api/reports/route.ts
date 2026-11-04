import{db}from'@/lib/db';import{secure,ok,fail,parseBody,audit}from'@/lib/api';import{protect,reveal,safeJson}from'@/lib/crypto';import{z}from'zod';
import{validDate,parentReport}from'@/lib/security';
const schema=z.object({title:z.string().trim().min(2).max(120),studentId:z.string().min(1).max(100),content:z.string().trim().min(2).max(12000),eventDate:validDate,parentId:z.string().max(100).nullish()}).strict();
export async function GET(req:Request){const a=await secure(req);if('error'in a)return a.error;
 const reports=await db.report.findMany({where:a.user.role==='teacher'?{teacherId:a.user.id}:{parentId:a.user.id,sharedWithParent:true,humanApprovedAt:{not:null}},select:{id:true,title:true,status:true,step:true,eventDate:true,updatedAt:true,sharedWithParent:true,humanApprovedAt:true,student:{select:{alias:true}}},orderBy:{updatedAt:'desc'},take:100});
 return ok({reports});}
export async function POST(req:Request){const a=await secure(req,['teacher']);if('error'in a)return a.error;const p=schema.safeParse(await parseBody(req));if(!p.success)return fail('리포트 항목을 확인해 주세요.');const b=p.data;
 const student=await db.student.findFirst({where:{id:b.studentId,teacherId:a.user.id}});if(!student)return fail('담당 학생이 아닙니다.',403);
 const report=await db.$transaction(async tx=>{const row=await tx.report.create({data:{title:b.title,teacherId:a.user.id,studentId:student.id,parentId:student.parentId||null,eventDate:new Date(b.eventDate),content:protect(b.content)}});await tx.auditLog.create({data:{userId:a.user.id,action:'report.created',detail:row.id}});return row;});
 return ok({reportId:report.id},201);}
