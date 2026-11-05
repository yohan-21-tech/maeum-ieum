import{it,expect}from'vitest';import{redactText}from'../lib/privacy';
it('흔한 말은 남기고 이름만 가린다',()=>expect(redactText('특정 학생과 상대 학생, 담임 선생님께 김민수 학생 일')).toBe('특정 학생과 상대 학생, 담임 선생님께 [이름] 학생 일'));
it('AI 답변에는 이름 추정을 끌 수 있다',()=>expect(redactText('바탕으로 선생님과 010-1234-5678',[],false)).toBe('바탕으로 선생님과 [전화번호]'));
