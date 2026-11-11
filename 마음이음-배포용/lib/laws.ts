import corpus from '../data/laws/sources.json';
import {z} from 'zod';
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v);
const sourceSchema=z.object({
 id:z.string(),title:z.string(),kind:z.enum(['law','official-case','guidance']),publisher:z.string(),url:z.string().url(),
 snippet:z.string().max(1500),keywords:z.array(z.string().min(2)),effectiveFrom:date.nullable(),effectiveTo:date.nullable(),
 verifiedAt:date,reviewDue:date,verificationStatus:z.enum(['verified','unverified']),locator:z.string(),applicability:z.string()
});
export type Source=z.infer<typeof sourceSchema>;
export function koreaDate(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function sourceStatus(source:Source,asOf=koreaDate()){
 const parsed=sourceSchema.safeParse(source);
 if(!parsed.success||!date.safeParse(asOf).success||source.verificationStatus!=='verified')return 'unverified';
 const url=new URL(source.url);
 if(url.protocol!=='https:'||url.username||url.password||!['law.go.kr','www.law.go.kr','www.moe.go.kr','www.goe.go.kr'].includes(url.hostname))return 'unverified';
 if(source.effectiveFrom&&source.effectiveTo&&source.effectiveFrom>source.effectiveTo)return 'unverified';
 if(source.verifiedAt>source.reviewDue)return 'unverified';
 if(source.effectiveFrom&&asOf<source.effectiveFrom)return 'not-effective';
 if(source.effectiveTo&&asOf>source.effectiveTo)return 'expired';
 if(asOf<source.verifiedAt||asOf>source.reviewDue)return 'review-required';
 return 'verified';
}
export function searchSources(query:string,sources:Source[],asOf=koreaDate()){
 const normalized=query.normalize('NFKC').toLowerCase();
 // 검토 기한이 지난 자료도 사라지지 않게 포함하되, 화면과 답변에 '원문 재확인 필요'를 표시한다.
 return sources.filter(s=>['verified','review-required'].includes(sourceStatus(s,asOf))).map(s=>({...s,reviewOverdue:sourceStatus(s,asOf)==='review-required',
  matchedKeywords:s.keywords.filter(k=>normalized.includes(k.toLowerCase()))
 })).filter(s=>s.matchedKeywords.length>0).sort((a,b)=>b.matchedKeywords.length-a.matchedKeywords.length||a.id.localeCompare(b.id)).slice(0,4);
}
export function evidenceRegistry(asOf=koreaDate()){
 return corpus.map(s=>({...s,status:sourceStatus(s as Source,asOf)}));
}
export async function findLawSources(query:string,asOf=koreaDate()){
 // shortcut: reviewed local corpus, add an authenticated official feed when coverage must scale.
 return searchSources(query,corpus as Source[],asOf);
}
