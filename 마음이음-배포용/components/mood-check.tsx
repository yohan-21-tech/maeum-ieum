'use client';
import {useEffect,useState} from 'react';import Link from 'next/link';import {ChevronRight} from 'lucide-react';

// 마음 날씨 체크인: 지금 마음 상태에 맞춰 먼저 할 일을 권한다. 선택은 이 브라우저에만 오늘 날짜로 기억한다.
type Mood={id:string;icon:string;label:string};
const MOODS:Mood[]=[{id:'sun',icon:'☀️',label:'맑음'},{id:'cloud',icon:'🌥️',label:'흐림'},{id:'rain',icon:'🌧️',label:'비'},{id:'storm',icon:'⛈️',label:'폭풍'}];
const ADVICE:Record<string,{teacher:{text:string;href:string;cta:string};parent:{text:string;href:string;cta:string}}>={
 sun:{teacher:{text:'마음이 여유로운 날이에요. 문제가 생기기 전에 학부모님께 좋은 소식 한 줄을 먼저 전해 보세요.',href:'/messages?compose=good',cta:'좋은 소식 보내기'},parent:{text:'여유로운 날이에요. 선생님께 감사 인사 한마디를 전해 보는 건 어떨까요?',href:'/messages?compose=good',cta:'감사 인사 보내기'}},
 cloud:{teacher:{text:'조금 마음이 쓰이는 일이 있나요? 기억이 선명할 때 사실만 먼저 기록해 두면 나중에 도움이 돼요.',href:'/diary',cta:'일지에 기록하기'},parent:{text:'궁금한 점이 있다면 선생님께 물어볼 질문부터 차분히 정리해 보세요.',href:'/messages?compose=questions',cta:'질문 정리하기'}},
 rain:{teacher:{text:'마음이 무거운 날이네요. 혼자 판단하지 말고 비슷한 상황과 참고 자료를 먼저 확인해 보세요.',href:'/chat',cta:'AI에게 상황 물어보기'},parent:{text:'속상한 일이 있었군요. 메시지를 보내기 전에 상대 입장에서 어떻게 읽힐지 먼저 살펴보세요.',href:'/messages',cta:'안심 대화 열기'}},
 storm:{teacher:{text:'감정이 크게 흔들릴 때는 바로 답장하지 않아도 괜찮아요. 10분 쉬고, 초안은 AI로 다듬은 뒤 다시 읽어 보세요.',href:'/messages',cta:'초안 다듬기'},parent:{text:'지금은 바로 보내지 않아도 괜찮아요. 10분 쉬고, 하고 싶은 말을 적은 뒤 상대 입장에서 다시 읽어 보세요.',href:'/messages',cta:'초안 다듬기'}}
};
export function MoodCheck({role}:{role:string}){
 const [mood,setMood]=useState('');
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Seoul'});
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem('maeum-mood')||'null');if(saved?.date===today)setMood(saved.id);}catch{}},[today]);
 const pick=(id:string)=>{setMood(id);try{localStorage.setItem('maeum-mood',JSON.stringify({id,date:today}));}catch{}};
 const advice=mood?ADVICE[mood][role==='parent'?'parent':'teacher']:null;
 return <div className="panel space-y-3">
  <div><h2 className="font-extrabold text-[17px]">오늘 마음 날씨는 어떤가요?</h2><p className="text-[11px] text-muted mt-0.5">선택은 이 기기에만 저장되고, 서버로 보내지 않아요.</p></div>
  <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="오늘 마음 날씨">{MOODS.map(m=><button key={m.id} role="radio" aria-checked={mood===m.id} onClick={()=>pick(m.id)} className={`rounded-2xl border py-3 flex flex-col items-center gap-1 text-[11px] font-semibold transition ${mood===m.id?'border-[#2bb673] bg-[#effaf4] text-[#1d7a55]':'border-[#e3ebe7] bg-white text-[#55656c]'}`}><span className="text-[22px] leading-none" aria-hidden>{m.icon}</span>{m.label}</button>)}</div>
  {advice&&<div className="rounded-2xl bg-[#f6f9f8] p-3 space-y-2"><p className="text-[13px] leading-relaxed">{advice.text}</p><Link href={advice.href} className="text-xs font-bold text-[#24996d] flex items-center gap-1">{advice.cta}<ChevronRight size={14}/></Link></div>}
 </div>;
}
