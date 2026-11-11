import{db}from'@/lib/db';import{secure,ok,fail,parseBody,audit}from'@/lib/api';import{protect}from'@/lib/crypto';import{proposalsFromCases}from'@/lib/cbr';import{demoEnabled}from'@/lib/security';import{demoPairFor,DEMO_REPORT_TITLE}from'@/lib/demo';
const stages=['시작','사건 인지','갈등 발생','불신 심화','문제 해결','신뢰 회복','사후 관리'];
export async function GET(req:Request,{params}:{params:Promise<{action:string}>}){const{action}=await params;const a=await secure(req);if('error'in a)return a.error;if(action!=='state')return fail('경로 없음',404);
 const stateId=demoPairFor(a.user.email)?.stateId;const s=stateId?await db.demoState.findUnique({where:{id:stateId}}):null;return ok({stage:s?.stage||0,stages});}
export async function POST(req:Request,{params}:{params:Promise<{action:string}>}){const{action}=await params;const a=await secure(req,['teacher']);if('error'in a)return a.error;if(!a.user.isDemo||!demoEnabled())return fail('데모 계정 전용 기능입니다.',403);
 if(action!=='advance'&&action!=='reset')return fail('경로 없음',404);
 const pair=demoPairFor(a.user.email);if(!pair)return fail('데모 계정 전용 기능입니다.',403);
 const t=await db.user.findUnique({where:{email:pair.teacherEmail}});const p=await db.user.findUnique({where:{email:pair.parentEmail}});
 if(!t||!p)return fail('시드 데이터 없음',404);
 const r=await db.report.findFirst({where:{teacherId:t.id,title:DEMO_REPORT_TITLE},orderBy:{createdAt:'desc'}});if(!r)return fail('데모 리포트가 없습니다.',404);
 if(action==='reset'){
  await db.reportResponse.deleteMany({where:{reportId:r.id}});
  await db.message.deleteMany({where:{OR:[{fromId:t.id,toId:p.id},{fromId:p.id,toId:t.id}]}});
  await db.report.update({where:{id:r.id},data:{step:1,status:'draft',sharedWithParent:false,humanApprovedAt:null,checklistJson:'[]',aiReportJson:'{}',proposalsJson:'[]',chosenProposalId:null}});
  await db.demoState.upsert({where:{id:pair.stateId},create:{id:pair.stateId,stage:0},update:{stage:0}});return ok({stage:0,reset:true});
 }
 const b=await parseBody(req);const stage=Number(b.stage);if(!Number.isInteger(stage)||stage<1||stage>6)return fail('단계는 1~6입니다.');
 const current=await db.demoState.findUnique({where:{id:pair.stateId}});if(stage!==(current?.stage||0)+1)return fail('순서대로 실행해 주세요.');
 if(stage===1){await db.report.update({where:{id:r.id},data:{step:1,status:'draft'}});}
 if(stage===2){await db.message.create({data:{fromId:p.id,toId:t.id,original:protect('[가상 시연] 아이의 이야기와 안내받은 내용이 달라서 정확한 상황을 확인하고 싶습니다.'),emotionScore:25,warningFlag:false}});}
 if(stage===3){await db.report.update({where:{id:r.id},data:{checklistJson:protect(JSON.stringify([{id:'c1',question:'사건 인지 시점은?',answer:'10월 29일 오전',confirmed:true},{id:'c2',question:'관련 학생의 진술이 모두 확인됐나요?',answer:'추가 확인 필요',confirmed:false}])),step:2,aiReportJson:protect(JSON.stringify({summary:'놀이 중 상황에 관한 설명이 달라 객관적 사실을 확인하고 있습니다.',verifiedFacts:['사건을 10월 29일 오전에 인지'],unverifiedItems:['관련 학생들의 진술 대조'],timeline:[{date:'10/29',event:'상황 인지·기록'}],notice:'AI 초안, 교사 검토 필수'}))}});}
 if(stage===4){const cases=await db.caseLibrary.findMany();await db.report.update({where:{id:r.id},data:{proposalsJson:protect(JSON.stringify(proposalsFromCases(r.title+' 교우관계 상담',cases))),step:3,status:'in_progress',sharedWithParent:false,humanApprovedAt:null}});}
 if(stage===5&&(!r.sharedWithParent||!r.humanApprovedAt))return fail('4단계 리포트를 열어 내용을 검토하고 공유를 승인한 뒤 진행하세요.',409);
 if(stage===5){await db.reportResponse.create({data:{reportId:r.id,authorId:p.id,type:'agree',content:protect('[가상 시연] 추가 사실을 확인하는 절차에 동의합니다. 안내 감사드립니다.')}});await db.report.update({where:{id:r.id},data:{step:4,status:'in_progress'}});}
 if(stage===6){await db.report.update({where:{id:r.id},data:{step:4,status:'resolved'}});}
 await db.demoState.upsert({where:{id:pair.stateId},create:{id:pair.stateId,stage},update:{stage}});await audit(a.user.id,'demo.stage',String(stage));return ok({stage,reportId:r.id});
}
