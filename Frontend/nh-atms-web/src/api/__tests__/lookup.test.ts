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

  it('쿼리 키는 lookupKeys.all 아래에 모인다(invalidate 용)', () => {
    expect(lookupKeys.models({ vendCode: '01' }).slice(0, 1)).toEqual(lookupKeys.all);
    expect(lookupKeys.codes('X')[0]).toBe(lookupKeys.all[0]);
  });
});
