import {it,expect} from 'vitest';
import {allowRequest} from '../lib/rate-limit';
it('bounds repeated calls and resets at expiry without blocking another identity',()=>{
 expect(allowRequest('a',2,1000,0)).toBe(true);expect(allowRequest('a',2,1000,1)).toBe(true);expect(allowRequest('a',2,1000,999)).toBe(false);
 expect(allowRequest('b',2,1000,999)).toBe(true);expect(allowRequest('a',2,1000,1000)).toBe(true);
});
