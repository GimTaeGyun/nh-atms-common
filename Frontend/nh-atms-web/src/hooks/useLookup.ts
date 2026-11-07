import { useQuery } from '@tanstack/react-query';
import { lookupApi, lookupKeys } from '@/api/endpoints/lookup';
import type { DistinctTarget } from '@/domain/lookup';
import { fmtOffice } from '@/utils/format';

/**
 * 공통 조회(`/api/lookup/*`) 훅 모음 — 콤보·팝업 부품이 쓴다. 캐시 시간은 자료 성격에 맞춰 길게(마스터성 자료).
 * 종속 콤보(사무소 → 기기 등)는 상위 값이 없으면 호출하지 않는다(enabled).
 */
const LONG = 30 * 60_000;
const MID = 5 * 60_000;

/** 사무소 전체 목록(콤보·팝업 공용, 30분 캐시) */
export const useOffices = () => useQuery({ queryKey: lookupKeys.offices(), queryFn: () => lookupApi.offices(), staleTime: LONG });

/** 사무소코드 → '[코드] 사무소명' (캐시 사용). 에코바·상세 표시용 */
export const useOfficeLabel = (ofcCode?: string | null): string => {
  const { data } = useOffices();
  return fmtOffice(ofcCode, data?.find((o) => o.ofcCode === ofcCode)?.kanm ?? undefined);
};

/** 인원 목록 — 사무소(ofcCode) 또는 검색어(q) 중 하나는 있어야 호출한다(둘 다 없으면 서버 400 LKP_001) */
export const usePersons = (p: { ofcCode?: string; q?: string }) =>
  useQuery({ queryKey: lookupKeys.persons(p), queryFn: () => lookupApi.persons(p), enabled: !!(p.ofcCode || p.q), staleTime: MID });

/** 기기사 목록 */
export const useVendors = () => useQuery({ queryKey: lookupKeys.vendors, queryFn: () => lookupApi.vendors(), staleTime: LONG });

/** 모델 목록 — vendCode 가 있어야 호출(기기사 종속). all=true 면 기기사 없이도 전체 */
export const useModels = (p: { vendCode?: string; mcnType?: string }, all = false) =>
  useQuery({ queryKey: lookupKeys.models(p), queryFn: () => lookupApi.models(p), enabled: all || !!p.vendCode, staleTime: MID });

/** 기기(기번) 목록 — 사무소 종속 */
export const useMcns = (ofcCode?: string, opts: { vendCode?: string; q?: string } = {}) =>
  useQuery({ queryKey: lookupKeys.machines({ ofcCode, ...opts }), queryFn: () => lookupApi.machines({ ofcCode: ofcCode!, ...opts }), enabled: !!ofcCode, staleTime: MID });

/** 코너 목록 — 사무소 종속 */
export const useCorners = (ofcCode?: string) =>
  useQuery({ queryKey: lookupKeys.corners(ofcCode), queryFn: () => lookupApi.corners(ofcCode!), enabled: !!ofcCode, staleTime: MID });

/** 있는 값 목록 */
export const useDistinct = (target: DistinctTarget) => useQuery({ queryKey: lookupKeys.distinct(target), queryFn: () => lookupApi.distinct(target), staleTime: MID });

/** 시도 목록 */
export const useSido = () => useQuery({ queryKey: lookupKeys.sido, queryFn: () => lookupApi.sido(), staleTime: LONG });

/** 시군 목록 — 시도 종속 */
export const useSigun = (sidoCode?: string) =>
  useQuery({ queryKey: lookupKeys.sigun(sidoCode), queryFn: () => lookupApi.sigun(sidoCode!), enabled: !!sidoCode, staleTime: LONG });
