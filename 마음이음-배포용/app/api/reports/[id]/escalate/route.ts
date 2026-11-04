import{db}from'@/lib/db';import{secure,ok,fail,parseBody,audit}from'@/lib/api';import{protect,reveal}from'@/lib/crypto';import{redactText}from'@/lib/privacy';
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){const a=await secure(req,['teacher']);if('error'in a)return a.error;const{id}=await params;
 const r=await db.report.findFirst({where:{id,teacherId:a.user.id}});if(!r)return fail('권한이 없습니다.',403);
 const b=await parseBody(req);if(!['manager','education_office'].includes(b.target))return fail('연계 대상을 선택하세요.');
 const body=`[가상 요청서 초안 — 자동 전송되지 않음]\n대상: ${b.target==='manager'?'학교 관리자':'교육청'}\n사안: ${redactText(r.title)}\n교사가 확인할 내용: ${redactText(reveal(r.content),[a.user.name])}\n요청: 사실 확인 및 적절한 공식 절차 검토\n※ 학생 개인정보를 확인하고 필요한 범위에서만 공유해 주세요.`;
 const row=await db.escalationRequest.create({data:{reportId:id,target:b.target,body:protect(body),status:'draft'}});
 await audit(a.user.id,'escalation.draft',id);return ok({draft:{id:row.id,body,status:row.status}});}
