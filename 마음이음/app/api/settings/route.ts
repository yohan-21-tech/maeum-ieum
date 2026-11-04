import{db}from'@/lib/db';import{secure,ok,fail,parseBody}from'@/lib/api';
import{z}from'zod';import{consentSchema,consentRecord}from'@/lib/security';
const time=z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const schema=z.object({availableStart:time.optional(),availableEnd:time.optional(),filterStrength:z.enum(['weak','normal','strong']).optional(),consents:consentSchema.optional()}).strict().refine(v=>Object.keys(v).length>0);
export async function PATCH(req:Request){
 const a=await secure(req);if('error'in a)return a.error;
 const p=schema.safeParse(await parseBody(req));if(!p.success)return fail('설정과 동의 값을 확인해 주세요.');
 const {consents,...data}=p.data;const record=consents?consentRecord(consents):null;
 await db.$transaction(async tx=>{
  await tx.user.update({where:{id:a.user.id},data:{...data,...(record?{consentJson:JSON.stringify(record)}:{})}});
  await tx.auditLog.create({data:{userId:a.user.id,action:record?(record.withdrawnAt?'consent.withdrawn':'consent.recorded'):'settings.updated',detail:record?JSON.stringify(record):undefined}});
 });return ok({success:true,...(record?{consents:record}:{})});
}
