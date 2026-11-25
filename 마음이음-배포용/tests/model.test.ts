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
describe('refine keeps the sender side',()=>{
 it('detects a reply that flips into the receiver apologizing',async()=>{const {flippedPerspective}=await import('../lib/ai');
  expect(flippedPerspective('왜 아직도 답이 없으세요? 당장 연락 주세요!!','문의하신 내용에 대해 아직 답변을 드리지 못해 연락이 지연되었습니다.')).toBe(true);
  expect(flippedPerspective('왜 아직도 답이 없으세요?','지난번 문의에 대한 답변을 기다리고 있습니다. 가능한 시간을 알려 주시겠어요?')).toBe(false);
  expect(flippedPerspective('늦게 답장드려 죄송합니다','늦어져 죄송합니다. 확인한 내용을 정리해 드릴게요.')).toBe(false);});
 it('falls back to the rule-based softening when the AI flips it',async()=>{vi.stubEnv('OPENAI_API_KEY','test');vi.stubGlobal('fetch',async()=>Response.json({choices:[{message:{content:'문의하신 내용에 대해 아직 답변을 드리지 못해 연락이 지연되었습니다.'}}]}));
  const {refineMessage}=await import('../lib/ai');const r=await refineMessage('왜 아직도 답이 없으세요? 당장 연락 주세요!!','teacher');expect(r.refined).toContain('가능한 일정에 맞춰');expect(r.mode).toBe('fallback');});
});
