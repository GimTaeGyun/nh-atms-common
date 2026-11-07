import { http } from 'msw';
import type { Me } from '@/types/auth';
import { MY_OFC_CODE, ME_PERSON } from '../data/lookup';
import { LATENCY, fail, ok } from './_util';

/** 목 고정 사용자 — 계약 §1 Me. 관리자 아님(권한은 메뉴 플래그로 본다) */
export const MOCK_ME: Me = {
  perNo: ME_PERSON.perNo,
  name: ME_PERSON.name,
  samuso: ME_PERSON.samuso,
  samusoName: ME_PERSON.samusoName,
  deptCode: 'D0001',
  ofcCode: MY_OFC_CODE,
  kanm: '테크부문',
  auth: 'T',
  adminYn: 'N',
};

/** 테스트용: true 면 /api/me 가 401 ME_001 (서버 문구와 같은 글) */
let meFail = false;
export const setMockMeFail = (v: boolean): void => {
  meFail = v;
};

export const ME_001_MESSAGE = '고정 사용자 개인번호가 없거나 인사정보에 없습니다. 설정 atms.fixed-user.per-no 를 확인하세요.';

export const meHandlers = [
  http.get('/api/me', async () => {
    await LATENCY();
    if (meFail) return fail(401, ME_001_MESSAGE, 'ME_001');
    return ok(MOCK_ME);
  }),
];
