import {describe,it,expect} from 'vitest';import{mayReadReport,mayWriteReport,mayMessageStudent}from'../lib/permissions';
const teacher={id:'t1',role:'teacher' as const},parent={id:'p1',role:'parent' as const},other={id:'p2',role:'parent' as const};
describe('리포트 공유 권한',()=>{
 it('공유 전에는 연결된 학부모라도 접근 불가',()=>expect(mayReadReport({teacherId:'t1',parentId:'p1',sharedWithParent:false},parent)).toBe(false));
 it('공유 후 연결된 학부모만 읽기 가능',()=>{const report={teacherId:'t1',parentId:'p1',sharedWithParent:true};expect(mayReadReport(report,parent)).toBe(true);expect(mayReadReport(report,other)).toBe(false)});
 it('교사는 본인의 리포트만 수정',()=>{expect(mayWriteReport({teacherId:'t1'},teacher)).toBe(true);expect(mayWriteReport({teacherId:'t1'},parent)).toBe(false);expect(mayReadReport({teacherId:'t1',parentId:null,sharedWithParent:false},teacher)).toBe(true)});
 it('다른 교사는 접근할 수 없음',()=>expect(mayReadReport({teacherId:'t1',parentId:'p1',sharedWithParent:true},{id:'t2',role:'teacher'})).toBe(false));
});
describe('대화 상대 권한',()=>it('연결 학생의 교사와 학부모만 대화',()=>{expect(mayMessageStudent('t1','p1',teacher,parent)).toBe(true);expect(mayMessageStudent('t1','p1',teacher,other)).toBe(false)}));
