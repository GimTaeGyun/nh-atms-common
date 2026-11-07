import { useQuery } from '@tanstack/react-query';
import { masterApi } from '@/api/endpoints/master';
import { qk } from '@/api/queryKeys';
import type { Option } from '@/types/common';
import type { Atm, CodeItem } from '@/domain/types';
import { fmtOffice } from '@/utils/format';

/** 공통코드 그룹 1회 로드(캐시 10분). 옵션/라벨 변환 헬퍼 포함 */
export const useCodes = (groupCd: string | undefined) => {
  const query = useQuery({ queryKey: qk.codes(groupCd ?? ''), queryFn: () => masterApi.codes(groupCd!), enabled: !!groupCd, staleTime: 10 * 60_000 });
  const items: CodeItem[] = query.data ?? [];
  const live = items.filter((c) => c.useYn !== 'N');
  const options: Option[] = live.map((c) => ({ value: c.code, label: c.name }));
  /** 값도 명칭으로 쓰는 옵션(AS-IS 가 코드 대신 명칭을 저장하는 항목용) */
  const labelOptions: Option[] = live.map((c) => ({ value: c.name, label: c.name }));
  const name = (code?: string | null): string => (code ? items.find((c) => c.code === code)?.name ?? code : '-');
  return { ...query, items, options, labelOptions, name };
};

export const useOffices = () => useQuery({ queryKey: qk.offices, queryFn: () => masterApi.offices(), staleTime: 30 * 60_000 });

export const useAtms = (officeCd?: string) =>
  useQuery<Atm[]>({ queryKey: qk.atms(officeCd), queryFn: () => masterApi.atms(officeCd), enabled: !!officeCd, staleTime: 5 * 60_000 });

/** 사무소코드 → '[코드] 사무소명' (마스터 캐시 사용). 에코바/상세 표시용 */
export const useOfficeLabel = (officeCd?: string | null): string => {
  const { data } = useOffices();
  return fmtOffice(officeCd, data?.find((o) => o.officeCd === officeCd)?.officeName);
};
