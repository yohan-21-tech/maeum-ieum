import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
vi.mock('next/headers',()=>({cookies:vi.fn(),headers:async()=>new Headers({host:'localhost:3000'})}));
vi.mock('../lib/db',()=>({db:{}}));
import {checkOrigin,hasAiConsent,type Principal} from '../lib/auth';
import {protect,reveal} from '../lib/crypto';
const consent={privacy:true,conversation:true,emotion:true,ai:true};
const user=(c:unknown)=>({consentJson:JSON.stringify(c)} as Principal);
afterEach(()=>vi.unstubAllEnvs());
describe('browser mutation boundary',()=>{
 it('rejects missing Origin on authenticated mutations',async()=>expect(await checkOrigin(new Request('http://localhost:3000/api/settings',{method:'PATCH'}))).toBe(false));
 it('rejects cross-scheme origin',async()=>expect(await checkOrigin(new Request('http://localhost:3000/api/settings',{method:'PATCH',headers:{origin:'https://localhost:3000'}}))).toBe(false));
 it('accepts only matching origin',async()=>expect(await checkOrigin(new Request('http://localhost:3000/api/settings',{method:'PATCH',headers:{origin:'http://localhost:3000'}}))).toBe(true));
 it('uses the received Host when Next normalizes the internal request URL',async()=>expect(await checkOrigin(new Request('http://localhost:3001/api/settings',{method:'PATCH',headers:{host:'127.0.0.1:3001',origin:'http://127.0.0.1:3001'}}))).toBe(true));
});
describe('versioned consent',()=>{
 it('rejects unversioned legacy consent',()=>expect(hasAiConsent(user(consent))).toBe(false));
 it('rejects withdrawn consent',()=>expect(hasAiConsent(user({...consent,version:'2026-11-03',updatedAt:'2026-11-03T00:00:00.000Z',withdrawnAt:'2026-11-03T01:00:00.000Z'}))).toBe(false));
 it('accepts an explicit current consent record',()=>expect(hasAiConsent(user({...consent,version:'2026-11-03',updatedAt:'2026-11-03T00:00:00.000Z',withdrawnAt:null}))).toBe(true));
 it('rejects coerced booleans',()=>expect(hasAiConsent(user({...consent,ai:'true'}))).toBe(false));
});
describe('production storage encryption',()=>{
 beforeEach(()=>vi.stubEnv('NODE_ENV','production'));
 it('fails closed without encryption key',()=>{vi.stubEnv('DATA_ENCRYPTION_KEY','');expect(()=>protect('private')).toThrow();expect(()=>reveal('private')).toThrow()});
 it('encrypts and authenticates round trips',()=>{vi.stubEnv('DATA_ENCRYPTION_KEY',Buffer.alloc(32,7).toString('base64'));const cipher=protect('private');expect(cipher).not.toContain('private');expect(reveal(cipher)).toBe('private');expect(()=>reveal(cipher.slice(0,-4)+'AAAA')).toThrow()});
});
