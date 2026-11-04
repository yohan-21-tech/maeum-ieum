import {db} from '@/lib/db';import {secure,ok,fail,parseBody,audit} from '@/lib/api';
import {protect,reveal,safeJson} from '@/lib/crypto';import {z} from 'zod';
const schema=z.object({studentId:z.string().min(1),date:z.string(),content:z.string().min(2).max(12000),tags:z.array(z.string()).max(10).default([]),aiSummary:z.string().optional(),attachmentBase64:z.string().optional(),attachmentType:z.enum(['image/png','image/jpeg','image/webp']).optional()});
export async function GET(req:Request){const a=await secure(req,['teacher']);if('error'in a)return a.error;
 const list=await db.diaryEntry.findMany({where:{teacherId:a.user.id},include:{student:{select:{alias:true}}},orderBy:{date:'desc'}});
 return ok({entries:list.map(x=>({...x,content:reveal(x.content),aiSummary:reveal(x.aiSummary),tags:safeJson(x.tags,[]),attachmentBase64:undefined,hasAttachment:!!x.attachmentBase64}))});}
export async function POST(req:Request){const a=await secure(req,['teacher']);if('error'in a)return a.error;
 const parsed=schema.safeParse(await parseBody(req));if(!parsed.success)return fail('일지 내용을 확인해 주세요.');const b=parsed.data;
 const student=await db.student.findFirst({where:{id:b.studentId,teacherId:a.user.id}});if(!student)return fail('담당 학생이 아닙니다.',403);
 if(b.attachmentBase64&&b.attachmentBase64.length>1_500_000)return fail('첨부파일은 약 1MB 이하만 가능합니다.');
 const entry=await db.diaryEntry.create({data:{teacherId:a.user.id,studentId:b.studentId,date:new Date(b.date),content:protect(b.content),tags:protect(JSON.stringify(b.tags)),aiSummary:b.aiSummary?protect(b.aiSummary):null,attachmentBase64:b.attachmentBase64?protect(b.attachmentBase64):null,attachmentType:b.attachmentType}});
 await audit(a.user.id,'diary.created',entry.id);return ok({entry:{id:entry.id}},201);}
