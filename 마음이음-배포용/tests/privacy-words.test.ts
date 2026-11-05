import{it,expect}from'vitest';import{redactText}from'../lib/privacy';
it('흔한 말은 남기고 이름만 가린다',()=>expect(redactText('특정 학생과 상대 학생, 담임 선생님께 김민수 학생 일')).toBe('특정 학생과 상대 학생, 담임 선생님께 [이름] 학생 일'));
