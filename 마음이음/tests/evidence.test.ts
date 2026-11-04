import {describe,it,expect} from 'vitest';
import {findLawSources,sourceStatus,searchSources,type Source} from '../lib/laws';
import {redactText,redactValue} from '../lib/privacy';
const source:Source={id:'law',title:'반복 민원',kind:'law',publisher:'법제처',url:'https://law.go.kr/example',snippet:'민원의 목적과 구체적인 사실을 확인합니다.',keywords:['민원','반복'],effectiveFrom:'2026-02-19',effectiveTo:'2026-12-02',verifiedAt:'2026-11-03',reviewDue:'2026-11-17',verificationStatus:'verified',locator:'제19조',applicability:'전국'};
describe('date-aware official evidence',()=>{
 it.each([['2026-02-18','not-effective'],['2026-11-03','verified'],['2026-11-18','review-required'],['2026-12-03','expired']] as const)('classifies source at %s', (date,status)=>expect(sourceStatus(source,date)).toBe(status));
 it('rejects deceptive hosts and malformed dates',()=>{
  expect(sourceStatus({...source,url:'https://law.go.kr.attacker.example/x'},'2026-11-03')).toBe('unverified');
  expect(sourceStatus({...source,effectiveFrom:'2026-02-31'},'2026-11-03')).toBe('unverified');
 });
 it('does not retrieve future, unverified or unrelated evidence',()=>{
  expect(searchSources('민원이 반복돼요',[{...source,effectiveFrom:'2026-11-20'},{...source,verificationStatus:'unverified'}],'2026-11-03')).toEqual([]);
  expect(searchSources('오늘 급식 메뉴',[source],'2026-11-03')).toEqual([]);
 });
 it('handles Korean suffixes and returns provenance',()=>{
  const found=searchSources('민원이 반복돼요',[source],'2026-11-03');
  expect(found[0]?.id).toBe('law');expect(found[0]?.verifiedAt).toBe('2026-11-03');
 });
 it('retrieves reviewed real corpus and no invented school schedules',async()=>{
  expect((await findLawSources('반복 민원 교육활동 침해','2026-11-03')).some(s=>s.id==='teacher-status-19')).toBe(true);
  expect(await findLawSources('우리 학교 내일 급식 시간표','2026-11-03')).toEqual([]);
 });
});
describe('provider privacy boundary',()=>{
 it('masks identifiers, contextual names and known names',()=>{
  const out=redactText('김민수 학생, 전화 010-1234-5678, minsu@example.com, 주민번호 160101-3123456. 이수진입니다.', ['이수진']);
  for(const secret of ['김민수','010-1234-5678','minsu@example.com','160101-3123456','이수진'])expect(out).not.toContain(secret);
  expect(out).toContain('[전화번호]');
 });
 it('redacts nested checklist answers without mutating original',()=>{
  const raw={items:[{answer:'연락처: 01012345678',confirmed:true}]};
  expect(redactValue(raw)).toEqual({items:[{answer:'연락처: [전화번호]',confirmed:true}]});
  expect(raw.items[0].answer).toContain('01012345678');
 });
});
