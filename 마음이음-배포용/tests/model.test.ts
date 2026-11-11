import {afterEach,describe,it,expect,vi} from 'vitest';
import {askModel} from '../lib/model';
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals()});
describe('optional model with bounded failure',()=>{
 it('uses explicit mock mode without key',async()=>{vi.stubEnv('OPENAI_API_KEY','');expect(await askModel('요약','자료')).toEqual({text:null,mode:'mock'});});
 it('sends only redacted content and falls back on invented legal authority',async()=>{
  vi.stubEnv('OPENAI_API_KEY','test');
  let sent='';vi.stubGlobal('fetch',async(_url:unknown,init:RequestInit)=>{sent=String(init.body);return Response.json({choices:[{message:{content:'법 제999조에 따라 반드시 배상해야 합니다.'}}]});});
  const result=await askModel('소통 초안','전화 010-1234-5678');
  expect(sent).not.toContain('010-1234-5678');expect(result.mode).toBe('fallback');expect(result.text).toBeNull();
 });
 it('does not expose provider error details',async()=>{vi.stubEnv('OPENAI_API_KEY','test');vi.stubGlobal('fetch',async()=>{throw new Error('provider secret')});expect(await askModel('요약','자료')).toEqual({text:null,mode:'fallback'});});
});
it('AI 답변의 마크다운 기호를 정리한다',async()=>{vi.stubEnv('OPENAI_API_KEY','test');vi.stubGlobal('fetch',async()=>Response.json({choices:[{message:{content:'**관찰 내용**\n* 점심시간 상황\n## 확인'}}]}));expect((await askModel('요약','자료')).text).toBe('관찰 내용\n• 점심시간 상황\n확인');});
describe('question helper fallbacks',()=>{
 it('gives three role-aware questions without AI',async()=>{vi.stubEnv('OPENAI_API_KEY','');const {questionHelper}=await import('../lib/ai');const r=await questionHelper('친구와 다툼','parent');expect(r.to).toBe('선생님');expect(r.questions).toHaveLength(3);});
 it('parses AI question lines',async()=>{vi.stubEnv('OPENAI_API_KEY','test');vi.stubGlobal('fetch',async()=>Response.json({choices:[{message:{content:'1. 그날 상황을 직접 보셨나요?\n2. 아이가 어떤 도움을 받고 있나요?\n3. 가정에서 함께 할 일이 있을까요?'}}]}));const {questionHelper}=await import('../lib/ai');const r=await questionHelper('다툼','parent');expect(r.questions[0]).toBe('그날 상황을 직접 보셨나요?');expect(r.mode).toBe('ai');});
});
