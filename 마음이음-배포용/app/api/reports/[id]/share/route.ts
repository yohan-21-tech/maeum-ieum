import{db}from'@/lib/db';import{secure,ok,fail,parseBody,audit}from'@/lib/api';
import{z}from'zod';import{safeJson}from'@/lib/crypto';
const schema=z.object({share:z.boolean(),humanApproved:z.boolean().optional(),expectedUpdatedAt:z.string().datetime().optional()}).strict();
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){const a=await secure(req,['teacher']);if('error'in a)return a.error;const{id}=await params;
 const r=await db.report.findFirst({where:{id,teacherId:a.user.id}});if(!r)return fail('리포트를 찾을 수 없습니다.',404);
 if(!r.parentId)return fail('이 학생에게 연결된 학부모 계정이 없습니다.');
 const p=schema.safeParse(await parseBody(req));if(!p.success)return fail('공유 입력값을 확인해 주세요.');const b=p.data;
 if(b.share&&(b.humanApproved!==true||!b.expectedUpdatedAt))return fail('최신 리포트 내용을 검토하고 공유 확인을 선택해 주세요.');
 const summary=safeJson<{summary?:unknown}>(r.aiReportJson,{});
 if(b.share&&(typeof summary.summary!=='string'||!summary.summary.trim()))return fail('공유할 요약 초안을 작성하고 검토해 주세요.');
 const changed=await db.$transaction(async tx=>{
  const result=await tx.report.updateMany({where:{id,teacherId:a.user.id,...(b.share?{updatedAt:new Date(b.expectedUpdatedAt!)}:{})},data:{sharedWithParent:b.share,humanApprovedAt:b.share?new Date():null}});
  if(!result.count)return false;
  await tx.auditLog.create({data:{userId:a.user.id,action:b.share?'report.shared':'report.unshared',detail:id}});return true;
 });
 return changed?ok({sharedWithParent:b.share}):fail('검토 중 리포트가 변경되었습니다. 새로고침 후 다시 확인해 주세요.',409);}
