import {db} from './db';
import {findLawSources,koreaDate} from './laws';
import {searchSimilar,proposalsFromCases} from './cbr';
import {soften,analyzeEmotion} from './emotion';
import {askModel} from './model';
import {PRIVACY_NOTICE,redactText} from './privacy';
import type {Principal} from './auth';
export async function chatbot(question:string,user:Principal){
 const found=searchSimilar(question,await db.caseLibrary.findMany(),4);
 const evidenceAsOf=koreaDate();const laws=await findLawSources(question,evidenceAsOf);
 const sources=[...laws.map(s=>({...s,detail:s.snippet})),...found.map(s=>({kind:'synthetic',id:s.id,title:s.title,detail:s.resolution,similarity:s.similarity,applicability:`가상 사례 · 일치 단어: ${s.matchedTerms.join(', ')} · 실제 사안 결과 예측 불가`}))];
 const hint=user.role==='parent'?'가정에서 확인한 내용과 학교에 확인할 질문을 나누어 적어 보세요. 교사의 설명을 먼저 듣고, 원하는 지원과 상담 가능한 시간을 함께 제안하세요.':'직접 관찰한 사실, 전해 들은 설명, 미확인 사항을 구분해 기록하세요. 학부모의 우려와 원하는 지원을 확인하고, 답변 가능한 시간을 안내하세요.';
 const result=await askModel('교사와 학부모 사이의 중립적인 소통을 돕습니다. 역할에 맞게 확인할 질문과 다음 상담 행동을 3문장 이내로 제안하세요. 자료의 상황과 다른 점은 확인 질문으로 남기세요.',JSON.stringify({role:user.role,question,caseEvidence:found,officialEvidence:laws.map(s=>({id:s.id,summary:s.snippet}))}));
 const legalNotice=laws.length?'공식 자료를 검색했지만 개별 사안에 대한 법적 판단은 아닙니다. 원문·지역·적용 시점과 사실관계를 담당자와 확인하세요.':'근거 자료 없음 — 검증된 공식 자료와 일치하지 않습니다. 학교 규정·일정이나 위법 여부를 추정하지 않습니다.';
 const evidence=laws.length?laws.map(s=>`[${s.title}] ${s.snippet}`).join('\n\n'):legalNotice;
 return {text:`${result.text||hint}\n\n${found[0]?`유사한 가상 사례: ${found[0].title}\n참고할 소통 방식: ${found[0].resolution}\n\n`:''}${evidence}`,sources,confidenceNote:`공식 자료 ${laws.length}건, 가상 사례 ${found.length}건. 문장 유사도는 정확도·승소 확률이 아닙니다. 사례의 지역·상황 차이를 검토하세요.`,legalNotice,mode:result.mode,humanChoiceRequired:true,evidenceAsOf,privacyNotice:PRIVACY_NOTICE};
}
export async function structureDiary(content:string){
 const result=await askModel('입력에서 관찰 내용과 전달받은 내용, 확인할 질문을 나누어 정리하세요. 없는 사실을 추가하지 마세요.',content);
 return {summary:result.text||`[사용자 기록 · 독립 검증되지 않음]\n${content.trim()}\n\n[확인 필요]\n사건 시각·장소, 직접 관찰한 사실과 전달받은 설명, 당사자 진술의 차이를 확인하세요.`,mode:result.mode,privacyNotice:PRIVACY_NOTICE,humanChoiceRequired:true};
}
export async function checklistFor(_content:string){
 const questions=['사건을 처음 알게 된 날짜와 시간을 확인하셨나요?','사건 발생 장소와 당시 상황을 확인하셨나요?','직접 관찰한 사실과 전해 들은 내용을 구분했나요?','관련 학생의 개인정보와 제삼자의 권리를 고려했나요?','학부모와 연락한 시점·방법을 기록했나요?','학부모의 설명과 추가 확인할 사항을 구분했나요?'];
 return {items:questions.map((question,i)=>({id:`c${i+1}`,question,answer:'',confirmed:false})),mode:'mock'};
}
export async function generateReport(content:string,checklist:Array<{question:string;answer:string;confirmed:boolean}>){
 const verified=checklist.filter(x=>x.confirmed&&x.answer.trim()).map(x=>`${x.question} ${x.answer}`);
 const unknown=checklist.filter(x=>!x.confirmed||!x.answer.trim()).map(x=>x.question);
 const result=await askModel('사용자 기록만 요약하세요. 관찰·전달·미확인 내용을 구분하고 당사자의 의도나 책임을 추정하지 마세요.',JSON.stringify({content,verified,unknown}));
 return {summary:result.text||`사용자가 제공한 기록입니다. ${content}`,verifiedFacts:verified,unverifiedItems:unknown,timeline:[{date:'작성 시점',event:'입력 기반 초안 생성 · 사건 시각은 원문과 대조 필요'}],whoWhatWhereWhenWhyHow:'입력되지 않은 시간·장소·당사자 정보는 미확인입니다.',notice:'사용자의 확인 표시는 독립적인 사실 검증이 아닙니다. AI 초안을 직접 검토·수정한 뒤 공유하세요.',mode:result.mode,humanChoiceRequired:true};
}
export async function alternativeSolutions(content:string){
 const proposals=proposalsFromCases(content,await db.caseLibrary.findMany());const laws=await findLawSources(content);
 return proposals.map(p=>({...p,sources:[...p.sources,...laws.map(s=>({...s,detail:s.snippet}))],legalSources:laws,legalNotice:laws.length?'공식 자료는 개별 대안의 적법성 보증이 아닙니다. 적용 요건을 직접 확인하세요.':p.legalNotice}));
}
export async function refineMessage(text:string){
 const result=await askModel('요청 목적을 유지하며 사실 확인과 존중을 담은 소통 문장으로 바꾸세요. 1~3문장, 상대 의도 단정 금지.',text);
 return {original:text,refined:result.text||soften(redactText(text)),emotion:analyzeEmotion(text),mode:result.mode,privacyNotice:PRIVACY_NOTICE,humanChoiceRequired:true};
}
