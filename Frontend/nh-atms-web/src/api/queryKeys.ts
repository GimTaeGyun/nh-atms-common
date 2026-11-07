/** 쿼리 키 팩토리 — 문자열 키 산재 방지. `*.all` 은 invalidate 용 루트 키 */
export const qk = {
  menu: { my: ['menu', 'my'] as const },
  /** 공통코드 항목 — useCodes 와 7201 이 같은 키를 쓴다 */
  codes: (groupCd: string) => ['codes', groupCd] as const,
  codesAll: ['codes'] as const,
  offices: ['offices'] as const,
  atms: (officeCd?: string) => ['atms', officeCd ?? 'all'] as const,
  employee: (empNo: string) => ['employee', empNo] as const,
  home: { summary: ['home', 'summary'] as const, scopeOptions: ['home', 'scopeOptions'] as const, atms: ['home', 'atms'] as const, faultTrend: ['home', 'faultTrend'] as const, recentFaults: ['home', 'recentFaults'] as const, notices: ['home', 'notices'] as const },
  tx: { list: (p: unknown) => ['tx', 'list', p] as const, specific: (p: unknown) => ['tx', 'specific', p] as const, detail: (k: unknown) => ['tx', 'detail', k] as const },
  fault: { all: ['fault'] as const, status: (p: unknown) => ['fault', 'status', p] as const, history: (p: unknown) => ['fault', 'history', p] as const, slip: (p: unknown) => ['fault', 'slip', p] as const, slipDetail: (p: unknown) => ['fault', 'slipDetail', p] as const },
  corner: { all: ['corner'] as const, list: (p: unknown) => ['corner', 'list', p] as const, one: (k: unknown) => ['corner', 'one', k] as const },
  cash: { all: ['cash'] as const, status: (p: unknown) => ['cash', 'status', p] as const, detail: (p: unknown) => ['cash', 'detail', p] as const },
  journal: { all: ['journal'] as const, list: (p: unknown) => ['journal', 'list', p] as const, detail: (k: unknown) => ['journal', 'detail', k] as const },
  stat: { nationwide: ['stat', 'nationwide'] as const, uptime: (p: unknown) => ['stat', 'uptime', p] as const },
  outsrc: { all: ['outsrc'] as const, atmStatus: (p: unknown) => ['outsrc', 'atmStatus', p] as const, dispatch: (p: unknown) => ['outsrc', 'dispatch', p] as const },
  board: { all: ['board'] as const, list: (p: unknown) => ['board', 'list', p] as const, one: (id: unknown) => ['board', 'one', id] as const },
  code: { all: ['code'] as const, groups: ['code', 'groups'] as const },
  auth: { all: ['authGrant'] as const, grants: (p: unknown) => ['authGrant', p] as const },
  remote: { all: ['remote'] as const, config: ['remote', 'config'] as const },
};
