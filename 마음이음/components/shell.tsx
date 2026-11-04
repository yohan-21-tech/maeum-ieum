'use client';
import Link from 'next/link';import{usePathname}from'next/navigation';import{Home,MessageCircle,NotebookPen,ClipboardList,UserRound,MessagesSquare,ShieldCheck,ChevronRight,FlaskConical}from'lucide-react';
import type{Principal}from'@/lib/auth';
export function Shell({user,children}:{user:Principal;children:React.ReactNode}){
 const path=usePathname();const teacher=user.role==='teacher';
 const tabs=teacher?[{href:'/home',icon:Home,label:'홈'},{href:'/chat',icon:MessageCircle,label:'AI 챗봇'},{href:'/diary',icon:NotebookPen,label:'교사 일지'},{href:'/reports',icon:ClipboardList,label:'AI 리포트'},{href:'/profile',icon:UserRound,label:'내 정보'}]:[{href:'/home',icon:Home,label:'홈'},{href:'/chat',icon:MessageCircle,label:'AI 챗봇'},{href:'/reports',icon:ClipboardList,label:'AI 리포트'},{href:'/messages',icon:MessagesSquare,label:'메시지·통화'},{href:'/profile',icon:UserRound,label:'내 정보'}];
 return <div className="phone" data-role={user.role}>
  <a className="skip-link" href="#main-content">본문으로 건너뛰기</a><header className="px-5 pt-7 pb-4 bg-white border-b border-[#edf1ef] flex justify-between items-center">
   <div className="flex items-center gap-2"><div className={`rounded-[12px] p-2 ${teacher?'bg-[#def8eb] text-[#1c9267]':'bg-[#fff0e4] text-[#d86b2c]'}`}><ShieldCheck size={21}/></div><div><p className="font-extrabold tracking-[-.05em] text-xl">마음이음<span className="text-[9px] text-muted ml-1.5 font-medium">BETA</span></p><p className="text-[10px] text-muted">교사와 학부모를 잇는 따뜻한 대화</p></div></div>
   <Link href="/demo" title="시나리오 데모" className="flex items-center gap-1 rounded-full bg-[#f4f8f6] px-3 py-2 text-[11px] font-bold text-[#567569]"><FlaskConical size={14}/> 데모</Link>
  </header>
  <div className={`mx-5 mt-4 rounded-2xl px-4 py-3 flex items-center justify-between ${teacher?'bg-gradient-to-r from-[#dff8ed] to-[#f0fbf7]':'bg-gradient-to-r from-[#fff0e2] to-[#fff9f2]'}`}><div><p className="text-xs text-[#56736a]">{teacher?'선생님 공간':'학부모 공간'}</p><p className="font-bold text-[14px] mt-0.5">{user.name}님, 안녕하세요 ☺</p></div><span className="pill">{teacher?'TEACHER':'PARENT'}</span></div>
  <main id="main-content" tabIndex={-1} className="flex-1 px-5 py-5 page-enter space-y-4">{children}</main>
  <div className="px-5 pb-2 pt-2 text-center text-[10px] text-[#758780] leading-relaxed">AI 제안은 참고용이며 법률 자문이 아닙니다. 최종 판단은 사용자가 합니다.</div>
  <nav aria-label="주요 메뉴" className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#e5ecea] flex justify-around px-1 py-2 pb-[max(8px,env(safe-area-inset-bottom))]">
   {tabs.map(t=>{const Icon=t.icon;const selected=path===t.href||path.startsWith(t.href+'/');return <Link key={t.href} href={t.href} aria-current={selected?'page':undefined} className={`flex-1 flex flex-col items-center justify-center min-h-[49px] gap-1 rounded-xl ${selected?teacher?'text-[#22996c]':'text-[#d96e2f]':'text-[#83928f]'}`}><Icon size={21} strokeWidth={selected?2.6:1.9}/><span className={`text-[10px] ${selected?'font-bold':'font-medium'}`}>{t.label}</span></Link>})}
  </nav>
 </div>;
}
