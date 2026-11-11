'use client';
import {useState} from 'react';import {Copy,Check,KeyRound} from 'lucide-react';

// 복구 코드를 한 번만 보여주고, 저장했다고 확인해야 다음으로 넘어가게 한다.
export function RecoveryCodeCard({code,onDone,doneLabel='확인했어요'}:{code:string;onDone:()=>void;doneLabel?:string}){
 const [copied,setCopied]=useState(false);const [saved,setSaved]=useState(false);
 const copy=async()=>{try{await navigator.clipboard.writeText(code);setCopied(true);setTimeout(()=>setCopied(false),2000);}catch{}};
 return <div className="panel space-y-4">
  <div className="flex items-center gap-2 font-extrabold"><KeyRound size={19} className="text-[#24996d]"/>비밀번호 복구 코드</div>
  <p className="text-[13px] leading-relaxed text-muted">비밀번호를 잊었을 때 이 코드로 새 비밀번호를 만들 수 있어요. <strong className="text-[#b4472f]">이 화면을 닫으면 다시 볼 수 없어요.</strong> 사진을 찍거나 메모장 등 안전한 곳에 저장해 두세요.</p>
  <div className="rounded-2xl bg-[#f3f8f5] border border-[#d9ebe2] py-4 text-center font-mono text-[20px] tracking-[0.12em] font-bold select-all" aria-label="복구 코드">{code}</div>
  <button type="button" onClick={copy} className="btn-outline w-full">{copied?<><Check size={16}/>복사했어요</>:<><Copy size={16}/>코드 복사</>}</button>
  <label className="flex gap-2 items-start text-xs font-normal"><input type="checkbox" checked={saved} onChange={e=>setSaved(e.target.checked)}/>복구 코드를 안전한 곳에 저장했어요.</label>
  <button type="button" className="btn-primary w-full" disabled={!saved} onClick={onDone}>{doneLabel}</button>
 </div>;
}
