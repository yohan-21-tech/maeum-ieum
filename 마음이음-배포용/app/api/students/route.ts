import {db} from '@/lib/db';import {secure,ok,fail,parseBody,audit} from '@/lib/api';import{randomBytes}from'crypto';
export async function GET(req:Request){const a=await secure(req);if('error'in a)return a.error;
 const students=await db.student.findMany({where:a.user.role==='teacher'?{teacherId:a.user.id}:{parentId:a.user.id},select:{id:true,alias:true,classId:true,parentId:true,pairingCode:a.user.role==='teacher'},orderBy:{alias:'asc'}});
 return ok({students});}
export async function POST(req:Request){const a=await secure(req,['teacher']);if('error'in a)return a.error;const b=await parseBody(req);
 const alias=String(b.alias||'').trim(),classId=String(b.classId||'').trim();if(alias.length<2||alias.length>30||classId.length<2||classId.length>30)return fail('학생 별칭과 학급을 2~30자로 입력해 주세요.');
 const pairingCode=randomBytes(5).toString('hex').toUpperCase();const student=await db.student.create({data:{alias,classId,teacherId:a.user.id,pairingCode}});await audit(a.user.id,'student.created',student.id);
 return ok({student:{id:student.id,alias:student.alias,pairingCode}},201);
}
export async function PATCH(req:Request){const a=await secure(req,['parent']);if('error'in a)return a.error;const b=await parseBody(req);const code=String(b.pairingCode||'').trim().toUpperCase();
 if(!/^[A-F0-9]{10}$/.test(code))return fail('10자리 연결 코드를 입력해 주세요.');
 const s=await db.student.findUnique({where:{pairingCode:code}});if(!s)return fail('연결 코드를 찾을 수 없습니다.',404);
 if(s.parentId&&s.parentId!==a.user.id)return fail('이미 다른 학부모 계정과 연결된 학생입니다.',403);
 const linked=await db.$transaction(async tx=>{const row=await tx.student.updateMany({where:{id:s.id,parentId:null,pairingCode:code},data:{parentId:a.user.id,pairingCode:null}});if(!row.count)return false;await tx.report.updateMany({where:{studentId:s.id,teacherId:s.teacherId},data:{parentId:a.user.id,sharedWithParent:false,humanApprovedAt:null}});await tx.auditLog.create({data:{userId:a.user.id,action:'student.linked',detail:s.id}});return true;});if(!linked)return fail('이미 사용된 연결 코드입니다.',409);return ok({student:{id:s.id,alias:s.alias}});
}
