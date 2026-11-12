// 챗봇 대화의 욕설·비속어를 같은 길이의 '*'로 가린다. 서버와 화면이 같은 규칙을 쓴다.
// '시 발', '씨1발', 'ㅅㅂ'처럼 글자 사이에 공백·숫자·기호를 끼운 변형도 잡는다.
// 일상어와 겹치는 말(시발점, 새끼손가락, 미친 듯이 등)은 가리지 않도록 문맥을 좁혔다.
// ponytail: 고정 단어 목록이라 새 변형은 WORDS에 추가해야 잡힌다.
const GAP='[\\s\\d._~!@#$%^&*()\\-+=/\\\\|]{0,2}';
const spaced=(w:string)=>[...w].map(c=>c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join(GAP);
const WORDS=[
 '씨발','씨빨','씨팔','씨바','시빨','시팔','쓰발','씹','좆','존나','졸라','좃나','병신','븅신','빙신','지랄','염병','썅','쌍년','쌍놈','개새끼','개새','개색','개세끼','개쉐','니미','느금','니애미','니애비','애미뒤','등신','닥쳐','꺼져','엿먹어','미친놈','미친년','미친새','또라이','fuck','shit','bitch','asshole'
];
const PATTERNS:RegExp[]=[
 // 긴 말부터 맞춰야 '개새끼'가 '개새'+'끼'로 갈리지 않는다.
 new RegExp(`(?:${[...WORDS].sort((a,b)=>b.length-a.length).map(spaced).join('|')})`,'gi'),
 // '시발'은 '시발점·시발역'이 아닐 때만
 new RegExp(`${spaced('시발')}(?!점|역)`,'g'),
 // '새끼'는 욕으로 쓰이는 앞뒤 말과 함께일 때만 (새끼손가락·새끼 고양이는 제외)
 new RegExp(`(?:[이저그니개씨](?:\\s{0,1}))${spaced('새끼')}|${spaced('새끼')}(?=\\s{0,1}(?:야|들아|들))`,'g'),
 // 초성 욕설
 /ㅅ\s?ㅂ|ㅆ\s?ㅂ|ㅂ\s?ㅅ|ㅄ|ㅈ\s?ㄹ|ㅈ\s?ㄴ|ㄱ\s?ㅅ\s?ㄲ|ㅁ\s?ㅊ/g
];
export function maskProfanity(text:string):{text:string;masked:boolean}{
 let masked=false;let out=text;
 for(const re of PATTERNS)out=out.replace(re,m=>{masked=true;return m.replace(/[^\s]/g,'*');});
 return {text:out,masked};
}
