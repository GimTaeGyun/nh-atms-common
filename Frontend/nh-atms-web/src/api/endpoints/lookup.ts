import { api } from '../http';
import type { Code, Corner, DistinctTarget, DistinctValue, Holiday, Machine, Model, Office, Person, Sido, Sigun, Src, Vendor } from '@/domain/lookup';
import { compactParams } from '@/utils/object';

/**
 * 공통 조회 API(`/api/lookup/*`, 모두 GET) — API 계약 §2. 콤보·팝업·날짜 부품의 원천.
 * 파라미터 이름 = 계약 그대로(ofcCode, vendCode, mcnType, q, from, to …). 빈 값은 보내지 않는다.
 */
export const lookupApi = {
  /** 사무소 목록 (q: 코드·사무소명 부분일치) */
  offices: (q?: string) => api.get<Office[]>('/lookup/offices', { params: compactParams({ q }) }),
  /** 사무소 1건 (없으면 404 LKP_404) */
  office: (ofcCode: string) => api.get<Office>(`/lookup/offices/${encodeURIComponent(ofcCode)}`),
  /** 인원 목록 (ofcCode·q 둘 다 없으면 400 LKP_001, 최대 200건) */
  persons: (p: { ofcCode?: string; q?: string }) => api.get<Person[]>('/lookup/persons', { params: compactParams(p) }),
  /** 인원 1건 (없으면 404 E404) */
  person: (perNo: string) => api.get<Person>(`/lookup/persons/${encodeURIComponent(perNo)}`),
  /** 기기사 목록 (원천 잠정 Q6 — vendNm 이 null 일 수 있다) */
  vendors: () => api.get<Vendor[]>('/lookup/vendors'),
  /** 모델 목록 */
  models: (p: { vendCode?: string; mcnType?: string } = {}) => api.get<Model[]>('/lookup/models', { params: compactParams(p) }),
  /** 기종(SRC) 목록 (vendCode 로 좁히기 선택) */
  srcs: (p: { vendCode?: string } = {}) => api.get<Src[]>('/lookup/srcs', { params: compactParams(p) }),
  /** 기기 목록 (ofcCode 필수 V001_20, q = 기번) */
  machines: (p: { ofcCode: string; vendCode?: string; q?: string }) => api.get<Machine[]>('/lookup/machines', { params: compactParams(p) }),
  /** 코너 목록 (ofcCode 필수) */
  corners: (ofcCode: string) => api.get<Corner[]>('/lookup/corners', { params: { ofcCode } }),
  /** 공통코드 (TB_CO_CODE 코드구분) */
  codes: (codeType: string) => api.get<Code[]>(`/lookup/codes/${encodeURIComponent(codeType)}`),
  /** 있는 값 목록 (허용 목록 밖은 400 LKP_002) */
  distinct: (target: DistinctTarget) => api.get<DistinctValue[]>(`/lookup/distinct/${encodeURIComponent(target)}`),
  sido: () => api.get<Sido[]>('/lookup/sido'),
  /** 시군 (sidoCode 필수) */
  sigun: (sidoCode: string) => api.get<Sigun[]>('/lookup/sigun', { params: { sidoCode } }),
  /** 휴일 (from·to YYYYMMDD, 최대 366일) */
  holidays: (from: string, to: string) => api.get<Holiday[]>('/lookup/holidays', { params: { from, to } }),
};

/** 공통 조회 쿼리 키 — `lookupKeys.all` 은 invalidate 용 루트 */
export const lookupKeys = {
  all: ['lookup'] as const,
  offices: (q?: string) => ['lookup', 'offices', q ?? ''] as const,
  office: (ofcCode: string) => ['lookup', 'office', ofcCode] as const,
  persons: (p: { ofcCode?: string; q?: string }) => ['lookup', 'persons', p.ofcCode ?? '', p.q ?? ''] as const,
  person: (perNo: string) => ['lookup', 'person', perNo] as const,
  vendors: ['lookup', 'vendors'] as const,
  models: (p: { vendCode?: string; mcnType?: string }) => ['lookup', 'models', p.vendCode ?? '', p.mcnType ?? ''] as const,
  srcs: (vendCode?: string) => ['lookup', 'srcs', vendCode ?? ''] as const,
  machines: (p: { ofcCode?: string; vendCode?: string; q?: string }) => ['lookup', 'machines', p.ofcCode ?? '', p.vendCode ?? '', p.q ?? ''] as const,
  corners: (ofcCode?: string) => ['lookup', 'corners', ofcCode ?? ''] as const,
  codes: (codeType: string) => ['lookup', 'codes', codeType] as const,
  distinct: (target: DistinctTarget) => ['lookup', 'distinct', target] as const,
  sido: ['lookup', 'sido'] as const,
  sigun: (sidoCode?: string) => ['lookup', 'sigun', sidoCode ?? ''] as const,
  holidays: (from: string, to: string) => ['lookup', 'holidays', from, to] as const,
};
