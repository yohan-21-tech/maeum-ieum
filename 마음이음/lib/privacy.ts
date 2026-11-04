export const PRIVACY_NOTICE='AI 입력에서 연락처·식별번호와 일부 이름을 자동 가립니다. 자동 비식별화는 완전하지 않으므로 실제 이름·주소·건강정보는 별칭으로 바꾸어 입력하세요.';
export function redactText(text:string,knownNames:string[]=[]):string{
 let result=text.normalize('NFKC')
  .replace(/\b\d{6}\s*[-–]?\s*[1-8]\d{6}\b/g,'[식별번호]')
  .replace(/(?:\+82[-\s]?)?0?1[016789][\s.-]?\d{3,4}[\s.-]?\d{4}\b/g,'[전화번호]')
  .replace(/\b0(?:2|[3-6]\d)[\s.-]?\d{3,4}[\s.-]?\d{4}\b/g,'[전화번호]')
  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[이메일]')
  .replace(/(?:성명|이름|학생명)\s*[:：]\s*[가-힣]{2,4}/g,'이름: [이름]')
  .replace(/[가-힣]{2,4}(?=\s*(?:학생|선생님|학부모님))/g,'[이름]')
  .replace(/(?:주소|거주지)\s*[:：][^\n]+/g,'주소: [주소]');
 for(const name of knownNames.filter(n=>n.trim().length>=2).sort((a,b)=>b.length-a.length))result=result.split(name).join('[별칭]');
 return result;
}
export function redactValue<T>(value:T,knownNames:string[]=[]):T{
 if(typeof value==='string')return redactText(value,knownNames) as T;
 if(Array.isArray(value))return value.map(v=>redactValue(v,knownNames)) as T;
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,redactValue(v,knownNames)])) as T;
 return value;
}
