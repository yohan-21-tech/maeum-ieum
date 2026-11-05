import{describe,it,expect}from'vitest';import{searchSimilar,proposalsFromCases,ruleAnswer,CBR_STAGES}from'../lib/cbr';
const cases=[{id:'A',title:'준비물 민원',situation:'학급 준비물 관련 문의',resolution:'정보 재안내',outcome:'success',tags:'["준비물"]',lesson:'공지를 단일화'},{id:'B',title:'교우관계 다툼',situation:'학생 친구 다툼에 대한 상담',resolution:'상담 예약',outcome:'fail',tags:'["교우관계"]',lesson:'관찰 확인'}];
describe('CBR 사례 기반추론',()=>{
 it('8단계 파이프라인 구성',()=>expect(CBR_STAGES).toHaveLength(8));
 it('키워드가 맞는 사례 우선 검색',()=>expect(searchSimilar('준비물 민원',cases)[0]?.id).toBe('A'));
 it('한국어 조사와 일치 근거를 다루고 확률로 표시하지 않는다',()=>{const hit=searchSimilar('준비물을 알려주세요',cases)[0];expect(hit?.id).toBe('A');expect(hit?.matchedTerms).toContain('준비물');expect(hit?.evidenceQuality).toBe('synthetic');});
 it('무관한 입력과 빈 입력에 사례를 만들어 반환하지 않는다',()=>{expect(searchSimilar('',cases)).toEqual([]);expect(searchSimilar('천체망원경',cases)).toEqual([])});
 it('제안에는 사례 근거와 인간 최종 판단 표시',()=>{const p=proposalsFromCases('준비물 민원',cases);expect(p).toHaveLength(3);expect(p[0].humanChoiceRequired).toBe(true);expect(p[0].legalNotice).toContain('근거 자료 없음')});
});
describe('AI 키 없는 챗봇 답변',()=>{
 const lib=[...cases,{id:'C',title:'상담 시간 외 연락 (협의 사례)',situation:'늦은 밤 긴급하지 않은 문의가 반복됨',resolution:'근무시간 및 긴급 연락 경로를 사전 안내',outcome:'success',tags:'["상담","연락","시간"]',lesson:'협의 포인트: 업무시간과 응답 기대를 사전에 합의'}];
 it('질문마다 맞는 사례로 다른 답을 준다',()=>{
  const a=ruleAnswer('teacher',searchSimilar('밤늦게 학부모가 계속 연락했는데 어떻게 하죠',lib));
  const b=ruleAnswer('parent',searchSimilar('준비물을 몰랐어요',lib));
  expect(a).toContain('근무시간 및 긴급 연락 경로');expect(a).toContain('업무시간과 응답 기대');
  expect(b).toContain('정보 재안내');expect(b).toContain('가정에서 확인한');expect(a).not.toBe(b);
 });
 it('맞는 사례가 없으면 구체적 정보를 요청한다',()=>expect(ruleAnswer('teacher',searchSimilar('천체망원경',lib))).toContain('찾지 못했어요'));
});
