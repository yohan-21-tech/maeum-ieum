import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcryptjs';
import {protect} from '../lib/crypto';
import {consentRecord,demoEnabled} from '../lib/security';
const db=new PrismaClient();
const scenarios:[string,string,string,string,string][]=[
 ['준비물 안내 누락','준비물 공지를 보지 못한 학부모가 갑작스러운 준비 요청에 항의','기존 공지 경로 확인 후 준비물 대체안과 재공지','공지 채널이 여러 개라 누락되는 문제는 통합 공지로 완화','준비물 공지 알림'],
 ['친구 간 장난 오해','학생 사이 장난에 대해 가정마다 피해 인식이 달라졌음','관찰 사실과 당사자 진술을 분리한 상담','학생 진술만으로 상대 책임을 단정하지 않기','교우관계 장난 갈등'],
 ['상담 시간 외 연락','늦은 밤 긴급하지 않은 문의가 반복됨','근무시간 및 긴급 연락 경로를 사전 안내','업무시간과 응답 기대를 사전에 합의','상담 연락 시간'],
 ['수업 중 전화 응답','교사 수업시간 전화에 바로 답이 없어 오해 발생','접수 확인과 예상 답변 시각 공유','지연 이유를 설명하지 않으면 회피로 오해 가능','응답 지연 연락'],
 ['학습 평가 해석 차이','가정에서 본 학습 상황과 교사 평가가 상이함','평가기준 및 작품을 함께 살펴보는 예약 상담','개별 기준 없는 평가 비교는 갈등을 키움','학습 평가 상담'],
 ['급식 관련 문의','급식 선택과 알레르기 정보에 관한 불확실성','학교 담당자와 확인 후 공식 정보만 전달','검증되지 않은 건강 판단을 하지 않기','급식 알레르기'],
 ['교외 다툼 책임','학교 밖에서 발생한 학생 간 다툼을 학교가 전적으로 해결해 달라는 요청','발생 장소와 관할 역할을 검토해 해당 담당자 연결','학교가 확인할 수 없는 사실을 확정하지 않기','교외 다툼 책임'],
 ['생활지도 표현 오해','생활지도 중 표현의 의미를 두고 시각 차이가 발생','사용한 말과 당시 맥락을 양측에 확인','서로 의도를 추정하면 불신이 커짐','생활지도 발언'],
 ['수업 사진 공유','자녀 사진이 학교 활동 기록에서 적다고 문의','촬영 목적과 공개 기준을 안내','타학생 개인정보와 형평성 고려','학급 사진 개인정보'],
 ['학급 행사 일정 변경','일정 변경 안내가 일부 가정에 전달되지 않음','변경 사항을 한 채널에 정리해 수신 확인','중복 채널의 정보 불일치 방지','학급 행사 일정'],
 ['친구 물건 분실','학생 물건의 분실 책임을 교사에게 요구','사실 확인 후 분실물 절차 안내','근거 없이 특정 학생을 지목하지 않기','분실물 친구'],
 ['지각 사유 설명','지각 이유에 대한 학생 진술과 가정 설명이 다름','확인 자료와 의견을 구분한 상담','미확인 진술을 확정적인 기록으로 남기지 않기','지각 출결'],
];
async function seedCases(){
 for(let i=0;i<scenarios.length;i++){
   const [title,situation,resolution,lesson,tags]=scenarios[i];
   for(const [suffix,outcome] of [['A','success'],['B','fail']] as const){
     await db.caseLibrary.upsert({where:{id:`DEMO-${String(i+1).padStart(2,'0')}-${suffix}`},update:{},create:{id:`DEMO-${String(i+1).padStart(2,'0')}-${suffix}`,title:`${title} (${outcome==='success'?'협의 사례':'개선 필요 사례'})`,situation,outcome,tags:JSON.stringify(tags.split(' ')),resolution:outcome==='success'?resolution:`연락이 반복되고 확인되지 않은 추측이 확대됨. ${resolution}`,lesson:outcome==='success'?`협의 포인트: ${lesson}`:`재발 방지: ${lesson}`}});
   }
 }
}
async function main(){
 // 참고 사례(가상 24건)는 운영 모드에서도 챗봇이 쓰므로 항상 넣는다. 이미 있으면 그대로 둔다(upsert).
 await seedCases();
 if(!demoEnabled()){console.log('Seed complete: 24 synthetic CBR cases (demo accounts skipped: demo disabled)');return;}
 const pw=await bcrypt.hash('Demo2026!',12);
 const teacher=await db.user.upsert({where:{email:'teacher@demo.local'},update:{name:'이수진',isDemo:true},create:{name:'이수진',email:'teacher@demo.local',role:'teacher',passwordHash:pw,consentJson:JSON.stringify(consentRecord({privacy:true,conversation:true,emotion:true,ai:true})),isDemo:true}});
 const parent=await db.user.upsert({where:{email:'parent@demo.local'},update:{name:'박혜정',isDemo:true},create:{name:'박혜정',email:'parent@demo.local',role:'parent',passwordHash:pw,consentJson:JSON.stringify(consentRecord({privacy:true,conversation:true,emotion:true,ai:true})),isDemo:true}});
 let student=await db.student.findFirst({where:{teacherId:teacher.id,alias:'학생A'}});
 if(!student) student=await db.student.create({data:{alias:'학생A',classId:'4학년 2반',teacherId:teacher.id,parentId:parent.id}});
 const other=await db.student.findFirst({where:{teacherId:teacher.id,alias:'학생B'}});
 if(!other) await db.student.create({data:{alias:'학생B',classId:'4학년 2반',teacherId:teacher.id}});
 let diary=await db.diaryEntry.findFirst({where:{teacherId:teacher.id,studentId:student.id}});
 if(!diary) diary=await db.diaryEntry.create({data:{teacherId:teacher.id,studentId:student.id,date:new Date('2026-10-29T09:30:00+09:00'),tags:protect(JSON.stringify(['교우관계','상담'])),content:protect('가상 사례: 학생 간 놀이 상황을 두고 양측의 설명이 다름. 당시 관찰 기록을 확인하고 학부모와 상담 일정을 조율할 예정입니다.')}});
 let report=await db.report.findFirst({where:{teacherId:teacher.id,studentId:student.id,title:'놀이 중 발생한 의견 차이'}});
 if(!report) report=await db.report.create({data:{title:'놀이 중 발생한 의견 차이',teacherId:teacher.id,studentId:student.id,parentId:parent.id,eventDate:new Date('2026-10-29T09:30:00+09:00'),content:diary.content,checklistJson:'[]',aiReportJson:'{}',proposalsJson:'[]',status:'draft',step:1,sharedWithParent:false}});
 await db.demoState.upsert({where:{id:'main'},update:{},create:{id:'main',stage:0}});
 console.log(`Seed complete: 24 synthetic CBR cases, teacher ${teacher.email}, parent ${parent.email}`);
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>db.$disconnect());
