'use client';
import {useState} from 'react';import {useRouter} from 'next/navigation';import Link from 'next/link';import {ArrowLeft,KeyRound} from 'lucide-react';
import {api,usePending,Notice} from '@/components/ui';import {RecoveryCodeCard} from '@/components/recovery-code';

export default function ResetPassword(){
 const router=useRouter();const task=usePending();
 const [email,setEmail]=useState('');const [code,setCode]=useState('');const [password,setPassword]=useState('');const [confirm,setConfirm]=useState('');
 const [newCode,setNewCode]=useState('');
 const mismatch=confirm.length>0&&password!==confirm;
 const submit=()=>task.run(async()=>{
  if(password.length<8)throw new Error('새 비밀번호는 8자 이상이어야 합니다.');
  if(password!==confirm)throw new Error('새 비밀번호가 서로 다릅니다.');
  const r=await api('/api/auth/reset',{method:'POST',body:JSON.stringify({email,recoveryCode:code,newPassword:password})});
  setNewCode(r.recoveryCode);
 });
 return <div className="phone p-6 bg-[#f9fbfa] space-y-5">
  <Link href="/login" className="flex items-center gap-2 text-sm text-muted"><ArrowLeft size={16}/>로그인으로</Link>
  <div className="pt-4"><div className="kicker">RESET PASSWORD</div><h1 className="text-2xl font-extrabold mt-2">비밀번호 찾기</h1><p className="text-sm text-muted mt-2">가입할 때 받은 복구 코드로 새 비밀번호를 만들어요.</p></div>
  {newCode?<>
   <Notice success="새 비밀번호로 바꿨어요. 다른 기기의 로그인은 모두 해제되었습니다."/>
   <p className="text-xs text-muted">사용한 복구 코드는 더 이상 쓸 수 없어요. 아래 새 코드를 저장해 주세요.</p>
   <RecoveryCodeCard code={newCode} doneLabel="저장했어요, 시작하기" onDone={()=>{router.replace('/home');router.refresh();}}/>
  </>:<form className="space-y-4" onSubmit={e=>{e.preventDefault();submit();}}>
   <div className="field"><label htmlFor="reset-email">이메일</label><input id="reset-email" type="email" autoComplete="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com"/></div>
   <div className="field"><label htmlFor="reset-code">복구 코드</label><input id="reset-code" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={40} value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="XXXX-XXXX-XXXX-XXXX" className="font-mono tracking-wider"/></div>
   <div className="field"><label htmlFor="reset-password">새 비밀번호 (8자 이상)</label><input id="reset-password" type="password" autoComplete="new-password" maxLength={72} value={password} onChange={e=>setPassword(e.target.value)} placeholder="새 비밀번호"/></div>
   <div className="field"><label htmlFor="reset-confirm">새 비밀번호 확인</label><input id="reset-confirm" type="password" autoComplete="new-password" maxLength={72} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="한 번 더 입력" aria-invalid={mismatch}/>{mismatch&&<p className="text-[11px] text-red-700 mt-1">새 비밀번호가 서로 다릅니다.</p>}</div>
   <Notice error={task.error}/>
   <button type="submit" className="btn-primary w-full" disabled={task.pending||!email||!code||!password||mismatch}><KeyRound size={16}/>새 비밀번호로 바꾸기</button>
   <div className="soft-panel text-xs text-muted leading-relaxed">복구 코드를 잃어버렸다면 이 화면에서 찾을 수 없어요. 로그인되어 있는 기기가 있다면 <strong>내 정보 → 비밀번호 복구 코드</strong>에서 새 코드를 받을 수 있어요.</div>
  </form>}
 </div>;
}
