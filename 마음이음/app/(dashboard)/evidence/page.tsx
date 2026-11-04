'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {api,Notice,Spinner,TitleBar,Sources} from '@/components/ui';
export default function EvidencePage(){
 const [data,setData]=useState<any>(null),[metrics,setMetrics]=useState<any>(null),[error,setError]=useState('');
 useEffect(()=>{Promise.all([api('/api/ai/evidence'),api('/api/ai/evaluation')]).then(([e,m])=>{setData(e);setMetrics(m)}).catch(e=>setError(e.message));},[]);
 return <><TitleBar eyebrow="EVIDENCE & FEEDBACK" title="근거와 평가" subtitle="공식 자료의 적용 시점과 내 응답 평가를 확인하세요."/><Notice error={error}/>{!data?<Spinner/>:<><div className="panel space-y-2"><p>검색 기준일: {data.asOf} (한국 시간)</p><p className="text-xs text-muted">{data.coverage}</p><p className="text-xs">검증 기한이 지나면 검색에서 자동 제외합니다. 원문 재검토는 운영자가 수행해야 합니다.</p></div>{data.sources.map((s:any)=><div key={s.id} className="panel"><p className="text-sm font-bold">{s.title}</p><p className="text-xs mt-2">{s.status==='verified'?'검색 가능':s.status==='not-effective'?'시행 전 · 검색 제외':s.status==='expired'?'적용 종료 · 검색 제외':'재검증 필요 · 검색 제외'}</p><p className="text-xs text-muted mt-1">검토 기한: {s.reviewDue} · {s.locator}</p><Sources sources={[{...s,detail:s.snippet}]}/></div>)}<div className="panel space-y-2"><h2 className="font-bold">내 응답 평가</h2><p className="text-sm">최근 응답 {metrics.sampleSize}개 · 도움 됨 {metrics.helpful} · 아쉬움 {metrics.unhelpful}</p><p className="text-sm">공식 근거 포함 {metrics.withOfficialEvidence} · 기본 안내 전환 {metrics.fallback}</p><p className="text-xs text-muted">{metrics.notice}</p></div></>}<Link href="/chat" className="btn-primary w-full">상담 질문하기</Link></>;
}
