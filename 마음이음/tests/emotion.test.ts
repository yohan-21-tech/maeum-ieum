import{describe,it,expect}from'vitest';import{analyzeEmotion,soften}from'../lib/emotion';
describe('감정 위험 표현',()=>{
 it('정중한 문장은 경고가 없음',()=>expect(analyzeEmotion('상황을 함께 확인하고 싶습니다.').warning).toBe(false));
 it('고위험 표현은 기본 민감도에서 경고',()=>{const r=analyzeEmotion('가만 안 둘 겁니다. 당장 책임져!!');expect(r.warning).toBe(true);expect(r.score).toBeGreaterThanOrEqual(55)});
 it('강한 필터는 더 보수적으로 경고',()=>{const txt='무책임한 대응';expect(analyzeEmotion(txt,'strong').warning).toBe(true)});
 it('정제 기능은 원래 요청을 유지하며 강한 표현을 완화',()=>expect(soften('당장 설명해주세요')).toContain('가능한 일정에 맞춰'));
});
