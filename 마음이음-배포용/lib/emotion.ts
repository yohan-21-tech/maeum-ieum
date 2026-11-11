export type Strength = 'weak'|'normal'|'strong';
const strongWords=['죽여','가만 안','고소해','신고해버','망하게','협박','찾아가서','해고시키','가만두지'];
const mildWords=['당장','말도 안','무책임','화가','최악','짜증','왜 안','무조건','사과해','불쾌','책임져'];
export function analyzeEmotion(text:string,strength:Strength='normal') {
  const hits=[...strongWords.filter(w=>text.includes(w)),...mildWords.filter(w=>text.includes(w))];
  const hard=strongWords.some(w=>text.includes(w));
  const score=Math.min(100,Math.round(12+hits.length*19+(hard?30:0)+(text.includes('!!')?8:0)));
  const threshold=strength==='weak'?80:strength==='strong'?30:55;
  const warning=score>=threshold;
  return {score,warning,level:score>=65?'위험':score>=35?'주의':'안정',hits,
    reason:hits.length?`표현 확인이 필요합니다: ${hits.join(', ')}`:'문장 내 뚜렷한 위험 표현을 발견하지 않았습니다.',
    disclaimer:'감정 점수는 단어 기반 참고 지표이며 감정·위법성 판정이 아닙니다.'};
}
export function soften(text:string){
  return text.replace(/당장/g,'가능한 일정에 맞춰').replace(/(?:너무\s*)?무책임(?:하시네요|하네요|하십니다|합니다|해요|하세요)/g,'설명이 부족하게 느껴집니다').replace(/무책임한/g,'설명이 부족한').replace(/무책임/g,'설명 부족').replace(/말도 안 되는/g,'이해하기 어려운').replace(/사과해(?:주세요)?/g,'상황에 대한 설명을 부탁드립니다').replace(/왜 안 해요\??/g,'진행 상황을 알려주실 수 있을까요?').replace(/고소해(?:버릴)?/g,'공식 절차를 확인해 보겠습니다').replace(/!!+/g,'.').trim();
}
