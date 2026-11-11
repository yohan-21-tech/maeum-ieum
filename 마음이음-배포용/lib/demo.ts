import {randomBytes} from 'crypto';
import bcrypt from 'bcryptjs';
import {db} from './db';
import {protect} from './crypto';
import {consentRecord} from './security';

// 방문자마다 교사·학부모 한 쌍의 체험 계정을 따로 만든다.
// 이메일에 같은 토큰을 넣어 짝을 찾고, 시나리오 진행도(DemoState)도 토큰별로 둔다.
// 예전 공용 계정(teacher@demo.local / parent@demo.local)은 'main' 짝으로 계속 동작한다.
const PAIR=/^demo-([a-f0-9]{12})-(teacher|parent)@demo\.local$/;
export type DemoPair={teacherEmail:string;parentEmail:string;stateId:string};
export function demoPairFor(email:string):DemoPair|null{
 if(email==='teacher@demo.local'||email==='parent@demo.local')return {teacherEmail:'teacher@demo.local',parentEmail:'parent@demo.local',stateId:'main'};
 const m=PAIR.exec(email);if(!m)return null;
 return {teacherEmail:`demo-${m[1]}-teacher@demo.local`,parentEmail:`demo-${m[1]}-parent@demo.local`,stateId:`demo-${m[1]}`};
}
export const DEMO_REPORT_TITLE='놀이 중 발생한 의견 차이';
export async function createDemoPair(){
 const token=randomBytes(6).toString('hex');
 const pair=demoPairFor(`demo-${token}-teacher@demo.local`)!;
 const passwordHash=await bcrypt.hash(randomBytes(24).toString('base64'),10);
 const consentJson=JSON.stringify(consentRecord({privacy:true,conversation:true,emotion:true,ai:true}));
 return db.$transaction(async tx=>{
  const teacher=await tx.user.create({data:{name:'이수진',email:pair.teacherEmail,role:'teacher',passwordHash,consentJson,isDemo:true}});
  const parent=await tx.user.create({data:{name:'박혜정',email:pair.parentEmail,role:'parent',passwordHash,consentJson,isDemo:true}});
  const student=await tx.student.create({data:{alias:'학생A',classId:'4학년 2반',teacherId:teacher.id,parentId:parent.id}});
  await tx.student.create({data:{alias:'학생B',classId:'4학년 2반',teacherId:teacher.id}});
  const diary=await tx.diaryEntry.create({data:{teacherId:teacher.id,studentId:student.id,date:new Date('2026-10-29T09:30:00+09:00'),tags:protect(JSON.stringify(['교우관계','상담'])),content:protect('가상 사례: 학생 간 놀이 상황을 두고 양측의 설명이 다름. 당시 관찰 기록을 확인하고 학부모와 상담 일정을 조율할 예정입니다.')}});
  await tx.report.create({data:{title:DEMO_REPORT_TITLE,teacherId:teacher.id,studentId:student.id,parentId:parent.id,eventDate:new Date('2026-10-29T09:30:00+09:00'),content:diary.content,checklistJson:'[]',aiReportJson:'{}',proposalsJson:'[]',status:'draft',step:1,sharedWithParent:false}});
  await tx.demoState.create({data:{id:pair.stateId,stage:0}});
  await tx.auditLog.create({data:{userId:teacher.id,action:'demo.created',detail:pair.stateId}});
  return {teacher,parent,pair};
 });
}
