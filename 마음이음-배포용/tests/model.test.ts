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
