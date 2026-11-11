export type CaseInput={id:string;title:string;situation:string;resolution:string;outcome:string;tags:string;lesson:string};
export type Evidence={id:string;title:string;similarity:number;outcome:string;resolution:string;lesson:string;source:'가상 시드 사례';matchedTerms:string[];evidenceQuality:'synthetic'};
export function terms(s:string){return (s.normalize('NFKC').toLowerCase().match(/[가-힣a-z0-9]{2,}/g)||[]).map(w=>w.length>3?w.replace(/(에서|에게|으로|이랑|을|를|은|는|이|가|에)$/,''):w).filter(w=>!['그리고','그러나','대한','관련','하는','있습니다','문제','때문에','학교','상담','학부모','학생','선생님','교사','아이','문의','요청','사례','안내','방법','상황','검색','절차','확인','어떻게'].includes(w));}
export function searchSimilar(query:string,cases:CaseInput[],max=4):Evidence[]{
  const docs=cases.map(c=>terms([c.title,c.situation,c.tags].join(' ')));
  // 활용형(연락했는데→연락, 급식이→급식)도 사례 단어와 맞도록 가장 긴 접두 단어로 맞춘다.
  const vocab=[...new Set(docs.flat())].sort((a,b)=>b.length-a.length);
  const q=new Set(terms(query).map(w=>vocab.includes(w)?w:vocab.find(v=>w.startsWith(v))||w));
  const n=docs.length;
  const df=new Map<string,number>();
  for(const d of docs){for(const w of new Set(d))df.set(w,(df.get(w)||0)+1);}
  const vector=(tokens:string[])=>{const map=new Map<string,number>();for(const w of tokens)map.set(w,(map.get(w)||0)+1);let norm=0;for(const [w,v] of map){const k=(v/tokens.length)*(Math.log((n+1)/((df.get(w)||0)+1))+1);map.set(w,k);norm+=k*k;}return {map,norm:Math.sqrt(norm)};};
  const qv=vector([...q]);
  return cases.map((c,i)=>{
    const dv=vector(docs[i]); let dot=0;
    for(const [w,v] of qv.map)dot+=v*(dv.map.get(w)||0);
    const sim=qv.norm&&dv.norm?dot/(qv.norm*dv.norm):0;
    return {id:c.id,title:c.title,similarity:Math.round(sim*100),outcome:c.outcome,resolution:c.resolution,lesson:c.lesson,source:'가상 시드 사례' as const,matchedTerms:[...q].filter(w=>dv.map.has(w)),evidenceQuality:'synthetic' as const};
  }).filter(c=>c.similarity>0).sort((a,b)=>b.similarity-a.similarity).slice(0,max);
}
// AI 키가 없거나 AI 출력이 차단됐을 때, 질문과 가장 가까운 사례로 답을 만든다.
export function ruleAnswer(role:string,found:Evidence[]){
  const next=role==='parent'
    ?'다음 행동: 가정에서 확인한 내용과 학교에 여쭤볼 질문을 나누어 적고, 원하는 지원과 상담 가능한 시간을 함께 전해 보세요.'
    :'다음 행동: 직접 관찰한 사실·전해 들은 설명·미확인 사항을 구분해 기록하고, 학부모가 원하는 지원과 답변 가능한 시간을 안내하세요.';
  const best=found.find(c=>c.outcome==='success')||found[0];
  if(!best)return `질문과 맞는 사례를 찾지 못했어요. 더 정확히 안내하려면 언제·어디서·어떤 일이 있었는지와 원하는 도움(사실 확인, 상담 예약, 연락 방법 등)을 함께 적어 주세요.\n\n${next}`;
  const topic=best.title.replace(/\s*\(.*\)$/,'');
  const resolution=best.outcome==='success'?best.resolution:best.resolution.split('. ').slice(1).join('. ')||best.resolution;
  return `'${topic}' 상황과 가장 비슷해 보여요 (일치 단어: ${best.matchedTerms.join(', ')}).\n\n권장 소통 방법: ${resolution}\n주의할 점: ${best.lesson.replace(/^[^:]+:\s*/,'')}\n\n${next}`;
}
export type CbrStage={step:number;name:string;description:string};
export const CBR_STAGES:CbrStage[]=[
  {step:1,name:'자료 축적',description:'가상 성공·실패 사례 기반 구축'},
  {step:2,name:'갈등 조사',description:'교사·학부모 입장과 확인 사실 기록'},
  {step:3,name:'갈등 분석',description:'TF-IDF 유사 사례 검색'},
  {step:4,name:'기본 해결안 추출',description:'유사 성공 사례를 참고한 대안 정리'},
  {step:5,name:'검토·수정·보완',description:'사용자가 내용과 제안 변경'},
  {step:6,name:'대안 제안',description:'근거와 제한사항을 함께 제시'},
  {step:7,name:'의견 제시',description:'동의·거부·수정안 기록'},
  {step:8,name:'합의 또는 재분석',description:'합의 시 사후관리, 이견 시 3단계 재개'}
];
export function proposalsFromCases(query:string,cases:CaseInput[]){
  const found=searchSimilar(query,cases,4);
  const success=found.filter(c=>c.outcome==='success');
  const failed=found.filter(c=>c.outcome==='fail');
  const bases=[
    {id:'p1',title:'사실관계 함께 정리하기',body:'확인된 사실과 아직 확인이 필요한 내용을 구분해 서면으로 공유하고, 서로의 설명을 기록합니다.'},
    {id:'p2',title:'공식 상담 일정 조율',body:'안전한 연락 시간에 상담을 예약하고 논의 목표와 다음 확인 일정을 먼저 합의합니다.'},
    {id:'p3',title:'관리자와 함께 검토',body:'양측 입장 차이가 크다면 교장·교감 등 학교 관리자에게 검토 및 중재를 요청합니다.'}
  ];
  return bases.map((b,i)=>({...b,caseIds:success.slice(i%2,i%2+2).map(c=>c.id),sources:[...success.slice(i%2,i%2+2).map(c=>({kind:'가상 사례',id:c.id,title:c.title}))],confidenceNote:success.length?'유사 사례 기반 참고 제안이며 실제 상황 적합성 검토 필요':'일치하는 사례 없음 — 일반적 소통 원칙에 따른 가설적 대안',legalSources:[],legalNotice:'근거 자료 없음 — 공식 법령·학칙을 확인한 뒤 판단하세요.',riskPattern:failed[0]?.lesson||'관련 실패 사례 근거 없음',humanChoiceRequired:true}));
}
