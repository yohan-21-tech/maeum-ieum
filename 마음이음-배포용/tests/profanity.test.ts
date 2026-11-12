import {it,expect} from 'vitest';import {maskProfanity} from '../lib/profanity';
const m=(s:string)=>maskProfanity(s).text;
it('masks common swear words with stars of the same length',()=>{
 expect(m('씨발 진짜 화나네')).toBe('** 진짜 화나네');
 expect(m('그 학부모 병신 같아요')).toBe('그 학부모 ** 같아요');
 expect(m('존나 짜증나')).toBe('** 짜증나');
 expect(m('개새끼야')).toBe('***야');
 expect(m('이 새끼가')).toBe('* **가');
 expect(m('ㅅㅂ 뭐야')).toBe('** 뭐야');
 expect(m('What the fuck')).toBe('What the ****');
});
it('catches spaced or digit-padded variants',()=>{
 expect(m('씨 발')).toBe('* *');
 expect(m('시1발')).toBe('***');
 expect(m('병.신')).toBe('***');
});
it('reports whether anything was masked',()=>{
 expect(maskProfanity('지랄하지 마').masked).toBe(true);
 expect(maskProfanity('상담 일정을 잡고 싶어요').masked).toBe(false);
});
it('leaves everyday words alone',()=>{
 for(const s of ['시발점과 종착역','새끼손가락을 다쳤어요','새끼 고양이를 키워요','미친 듯이 공부했어요','병원에 다녀왔어요','서로 존중해요','개선 방법','등산을 갔어요','졸업식 일정','시발역에서 만나요','꺼림칙해요'])expect(m(s)).toBe(s);
});
