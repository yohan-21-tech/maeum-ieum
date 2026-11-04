import {db} from '@/lib/db';import{secure,fail}from '@/lib/api';import{reveal}from '@/lib/crypto';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){const a=await secure(req,['teacher']);if('error'in a)return a.error;const{id}=await params;
 const d=await db.diaryEntry.findFirst({where:{id,teacherId:a.user.id}});if(!d||!d.attachmentBase64||!d.attachmentType)return fail('첨부파일이 없습니다.',404);
 const content=reveal(d.attachmentBase64);return new Response(Buffer.from(content,'base64'),{headers:{'Content-Type':d.attachmentType,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
