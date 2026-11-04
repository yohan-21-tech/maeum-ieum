import {secure,ok,fail,parseBody} from '@/lib/api';
import {db} from '@/lib/db';
import {z} from 'zod';
export async function DELETE(req:Request){
 const a=await secure(req);if('error'in a)return a.error;
 if(!z.object({scope:z.literal('ai-history'),confirm:z.literal(true)}).strict().safeParse(await parseBody(req)).success)return fail('삭제 범위와 확인 값이 필요합니다.');
 await db.$transaction(async tx=>{
  const user=await tx.user.findUniqueOrThrow({where:{id:a.user.id},select:{consentJson:true}});
  const consent=JSON.parse(user.consentJson);
  await tx.user.update({where:{id:a.user.id},data:{consentJson:JSON.stringify({...consent,updatedAt:new Date().toISOString()})}});
  await tx.chatMessage.deleteMany({where:{userId:a.user.id}});
  await tx.diaryEntry.updateMany({where:{teacherId:a.user.id},data:{aiSummary:null}});
  await tx.report.updateMany({where:{teacherId:a.user.id},data:{aiReportJson:'{}',proposalsJson:'[]',chosenProposalId:null,sharedWithParent:false,humanApprovedAt:null}});
  await tx.auditLog.create({data:{userId:a.user.id,action:'privacy.ai-history-deleted',detail:'Own chats, feedback and AI drafts; original records retained'}});
 });return ok({success:true});
}
