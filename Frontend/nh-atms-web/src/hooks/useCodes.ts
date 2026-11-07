import { useQuery } from '@tanstack/react-query';
import { lookupApi, lookupKeys } from '@/api/endpoints/lookup';
import type { Option } from '@/types/common';
import type { Code } from '@/domain/lookup';

/**
 * 공통코드 한 코드구분을 1회 로드(캐시 10분) — `GET /api/lookup/codes/{codeType}` (TB_CO_CODE).
 * 서버가 USE_YN='Y' 만, SORT_ORD·CODE 순으로 준다. 옵션은 value=code, label=codeNm(없으면 code).
 */
export const useCodes = (codeType: string | undefined) => {
  const query = useQuery({ queryKey: lookupKeys.codes(codeType ?? ''), queryFn: () => lookupApi.codes(codeType!), enabled: !!codeType, staleTime: 10 * 60_000 });
  const items: Code[] = query.data ?? [];
  const live = items.filter((c) => c.useYn !== 'N');
  const options: Option[] = live.map((c) => ({ value: c.code, label: c.codeNm ?? c.code }));
  /** 값도 명칭으로 쓰는 옵션(코드 대신 명칭을 저장하는 항목용) */
  const labelOptions: Option[] = live.map((c) => ({ value: c.codeNm ?? c.code, label: c.codeNm ?? c.code }));
  /** 코드 → 명칭 (없으면 코드, 빈 값이면 '-') */
  const name = (code?: string | null): string => (code ? items.find((c) => c.code === code)?.codeNm ?? code : '-');
  return { ...query, items, options, labelOptions, name };
};
