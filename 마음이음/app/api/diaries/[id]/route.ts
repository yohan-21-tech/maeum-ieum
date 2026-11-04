import {db} from '@/lib/db';import{secure,ok,fail,parseBody,audit}from '@/lib/api';import{protect}from '@/lib/crypto';
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){const a=await secure(req,['teacher']);if('error'in a)return a.error;
 const {id}=await params;const existing=await db.diaryEntry.findFirst({where:{id,teacherId:a.user.id}});if(!existing)return fail('일지를 찾을 수 없습니다.',404);
 const b=await parseBody(req);const data:{content?:string;aiSummary?:string;tags?:string}={};
 if(typeof b.content==='string')data.content=protect(b.content.slice(0,12000));if(typeof b.aiSummary==='string')data.aiSummary=protect(b.aiSummary.slice(0,8000));if(Array.isArray(b.tags))data.tags=protect(JSON.stringify(b.tags.slice(0,10)));
 await db.diaryEntry.update({where:{id},data});await audit(a.user.id,'diary.updated',id);return ok({success:true});}
export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){const a=await secure(req,['teacher']);if('error'in a)return a.error;const{id}=await params;
 const result=await db.diaryEntry.deleteMany({where:{id,teacherId:a.user.id}});if(!result.count)return fail('일지를 찾을 수 없습니다.',404);await audit(a.user.id,'diary.deleted',id);return ok({success:true});}
