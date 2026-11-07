import { describe, expect, it } from 'vitest';
import { lookupApi, lookupKeys } from '@/api/endpoints/lookup';
import { menuApi } from '@/api/endpoints/menu';
import { meApi } from '@/api/endpoints/me';
import type { AppError } from '@/api/errors';

/** 목 응답 = 계약서(07_API_계약.md §1·§2). 필드 이름이 바뀌면 여기서 먼저 깨진다 */
const keysOf = (o: object) => Object.keys(o).sort();

describe('공통 조회 API 계약(목)', () => {
  it('me·menu 모양', async () => {
    expect(keysOf(await meApi.get())).toEqual(['adminYn', 'auth', 'deptCode', 'kanm', 'name', 'ofcCode', 'perNo', 'samuso', 'samusoName']);
    const [g] = await menuApi.my();
    expect(keysOf(g)).toEqual(['children', 'delRolYn', 'exeRolYn', 'menuId', 'menuNm', 'menuPath', 'menuType', 'parentMenuId', 'qryRolYn', 'regRolYn', 'sortNo', 'updRolYn', 'useYn']);
    expect(g.children.map((c) => c.menuPath)).toEqual(['/sample/common-modules', '/sample/notice', '/sample/mcn-info', '/sample/mcn-model']);
  });

  it('lookup 응답 필드', async () => {
    expect(keysOf((await lookupApi.offices())[0])).toEqual(['kanm', 'ofcCode', 'sidoCode', 'sidoNm']);
    expect(keysOf(await lookupApi.person('1234567'))).toEqual(['jikeubName', 'name', 'perNo', 'samuso', 'samusoName']);
    expect(keysOf((await lookupApi.vendors())[0])).toEqual(['vendCode', 'vendNm']);
    expect(keysOf((await lookupApi.models({ vendCode: '01' }))[0])).toEqual(['mcnType', 'modelCode', 'modelNm', 'vendCode']);
    expect(keysOf((await lookupApi.machines({ ofcCode: '000080' }))[0])).toEqual(['instPstCode', 'instPstNm', 'komType', 'mcnNo', 'ofcCode', 'src', 'srcNm', 'useYn', 'vendCode']);
    expect(keysOf((await lookupApi.corners('000080'))[0])).toEqual(['instPstCode', 'instPstNm', 'ofcCode', 'useYn']);
    expect(keysOf((await lookupApi.codes('SAMPLE'))[0])).toEqual(['code', 'codeNm', 'codeType', 'desc1', 'desc2', 'desc3', 'sortOrd', 'useYn']);
    expect(keysOf((await lookupApi.sigun('11'))[0])).toEqual(['sidoCode', 'sigunCode', 'sigunNm']);
    expect(keysOf((await lookupApi.holidays('20261201', '20261201'))[0])).toEqual(['closeYn', 'dayType', 'hdayDt', 'hdayYn']);
  });

  it('오류코드: 인원 조건 없음 LKP_001, 없는 target LKP_002, 없는 사무소 LKP_404, 없는 개인번호 E404', async () => {
    const codeOf = async (p: Promise<unknown>) => ((await p.catch((e: unknown) => e)) as AppError).code;
    expect(await codeOf(lookupApi.persons({}))).toBe('LKP_001');
    expect(await codeOf(lookupApi.distinct('nope' as never))).toBe('LKP_002');
    expect(await codeOf(lookupApi.office('999999'))).toBe('LKP_404');
    expect(await codeOf(lookupApi.person('0000000'))).toBe('E404');
  });

  it('휴일 오류는 백엔드 LookupService 와 같은 순서·코드·{0} 인자(VAL_002 → VAL_003 → VAL_001 from~to)', async () => {
    const errOf = async (p: Promise<unknown>) => {
      const e = (await p.catch((x: unknown) => x)) as AppError;
      return [e.code, e.message];
    };
    expect(await errOf(lookupApi.holidays('', '20261231'))).toEqual(['VAL_002', '필수 파라미터가 없습니다: from']);
    expect(await errOf(lookupApi.holidays('20260101', ''))).toEqual(['VAL_002', '필수 파라미터가 없습니다: to']);
    expect(await errOf(lookupApi.holidays('2026-01-01', '20261231'))).toEqual(['VAL_003', '파라미터 형식이 올바르지 않습니다: from']);
    expect(await errOf(lookupApi.holidays('20260101', '20261332'))).toEqual(['VAL_003', '파라미터 형식이 올바르지 않습니다: to']);
    expect(await errOf(lookupApi.holidays('20261231', '20260101'))).toEqual(['VAL_001', '입력값이 올바르지 않습니다: from~to']);
    expect(await errOf(lookupApi.holidays('20260101', '20270102'))).toEqual(['VAL_001', '입력값이 올바르지 않습니다: from~to']);
    expect(await lookupApi.holidays('20260101', '20261231')).toHaveLength(365);
  });

  it('인원 q: 성명 부분일치 또는 개인번호 앞자리(백엔드 LookupMapper.xml selectPersons)', async () => {
    expect((await lookupApi.persons({ q: '123456' })).map((p) => p.perNo)).toContain('1234567');
    expect(await lookupApi.persons({ q: '234567' })).toEqual([]);
    expect((await lookupApi.persons({ q: '길동' })).map((p) => p.name)).toContain('홍길동');
  });

  it('사무소코드: 숫자는 앞자리 0 채움, 숫자 아님·7자리 이상은 VAL_003 (백엔드 OfficeCode)', async () => {
    expect((await lookupApi.corners('80')).every((c) => c.ofcCode === '000080')).toBe(true);
    expect(((await lookupApi.corners('8A').catch((x: unknown) => x)) as AppError).code).toBe('VAL_003');
    expect(((await lookupApi.machines({ ofcCode: '1234567' }).catch((x: unknown) => x)) as AppError).code).toBe('VAL_003');
  });

  it('쿼리 키는 lookupKeys.all 아래에 모인다(invalidate 용)', () => {
    expect(lookupKeys.models({ vendCode: '01' }).slice(0, 1)).toEqual(lookupKeys.all);
    expect(lookupKeys.codes('X')[0]).toBe(lookupKeys.all[0]);
  });
});
