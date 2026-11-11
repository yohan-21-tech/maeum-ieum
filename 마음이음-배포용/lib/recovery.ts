import {randomInt,timingSafeEqual} from 'crypto';
import {sha} from './auth';

// 비밀번호 복구 코드: 헷갈리는 글자(0,O,1,I,L)를 뺀 31자에서 16자를 뽑아 4자리씩 끊어 보여준다 (약 79비트).
// 서버에는 해시만 저장하고, 코드는 발급할 때 한 번만 사용자에게 보여준다. 한 번 쓰면 새 코드로 바뀐다.
const ALPHABET='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function generateRecoveryCode(){
 const raw=Array.from({length:16},()=>ALPHABET[randomInt(ALPHABET.length)]).join('');
 return raw.match(/.{4}/g)!.join('-');
}
export function normalizeRecoveryCode(code:string){return code.toUpperCase().replace(/[^A-Z0-9]/g,'');}
export function hashRecoveryCode(code:string){return sha('recovery:'+normalizeRecoveryCode(code));}
export function recoveryCodeMatches(code:string,storedHash:string|null|undefined){
 if(!storedHash)return false;
 const a=Buffer.from(hashRecoveryCode(code),'hex');const b=Buffer.from(storedHash,'hex');
 return a.length===b.length&&timingSafeEqual(a,b);
}
