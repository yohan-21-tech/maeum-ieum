import { NextResponse } from 'next/server';
import { currentUser, checkOrigin, type Principal } from './auth';
import {mayReadReport,mayWriteReport} from './permissions';
export const fail=(msg:string,status=400)=>NextResponse.json({error:msg},{status});
export const ok=(data:unknown,status=200)=>NextResponse.json(data,{status});
export async function secure(request:Request, roles?:Array<'teacher'|'parent'>): Promise<{user:Principal}|{error:NextResponse}> {
  if (!await checkOrigin(request)) return {error:fail('Origin check failed',403)};
  const user=await currentUser();
  if (!user) return {error:fail('로그인이 필요합니다.',401)};
  if (roles && !roles.includes(user.role)) return {error:fail('권한이 없습니다.',403)};
  return {user};
}
export const parseBody=async(request:Request)=>{
 try{
  if(!request.headers.get('content-type')?.includes('application/json'))return {};
  const limit=new URL(request.url).pathname==='/api/diaries'?1_600_000:100_000;
  if(Number(request.headers.get('content-length'))>limit)return {};
  const reader=request.body?.getReader();if(!reader)return {};
  const chunks:Uint8Array[]=[];let size=0;
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();return {};}chunks.push(value);}
  const value=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  return value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 }catch{return {};}
};
export function sameUserReport(report:{teacherId:string;parentId:string|null;sharedWithParent:boolean;humanApprovedAt?:Date|null},user:Principal){
  return mayReadReport(report,user)&&(user.role==='teacher'||!!report.humanApprovedAt);
}
export function canEditReport(report:{teacherId:string},user:Principal){return mayWriteReport(report,user);}
export async function audit(userId:string,action:string,detail?:string){
  const {db}=await import('./db');await db.auditLog.create({data:{userId,action,detail}});
}
