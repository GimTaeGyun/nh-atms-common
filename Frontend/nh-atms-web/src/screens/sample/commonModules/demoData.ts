/**
 * 공통 모듈 화면 전용 화면 안 견본 자료 — 표·출력·팝업 시연용. **API 가 아니다**(서버 호출 없음).
 * createRng 로 만들어 새로고침해도 같은 값. 길이는 정본 컬럼 길이에 맞춘다(사무소코드 6, 기번 3, 기기사 2 …).
 * 원문 열람·파일 올리기·행 명령·명령 폴링은 여기의 가짜 요청 함수(Promise)로 흉내 낸다(설계 §8.1 "데모 응답").
 */
import type { UploadedFile } from '@/hooks/useFileUpload';
import type { CommandStatus } from '@/hooks/useCommandPoll';
import type { RowCommandResult } from '@/components/grid/RowCommandButton';
import type { ApprovalStatus } from '@/components/approval/approvalStatus';
import { dayjs } from '@/utils/date';
import { createRng } from '@/utils/random';

/** 표 시연 1행 — 이름은 TO-BE 컬럼 camelCase 를 흉내 냄(화면 안 자료) */
export interface DemoRow {
  /** 행 키: 사무소코드-기번 */
  id: string;
  ofcCode: string;
  kanm: string;
  mcnNo: string;
  vendNm: string;
  modelNm: string | null;
  useYn: 'Y' | 'N';
  /** 365 운영 여부 */
  opYn: 'Y' | 'N';
  wrtDate: string;
  wrtTime: string;
  amount: number;
  cnt: number;
  rate: number;
  telNo: string;
  acctNo: string;
  name: string;
  aprvStatus: ApprovalStatus;
  result: string;
}

const OFFICES: [string, string][] = [['000080', '테크부문'], ['000101', '본점영업부'], ['000215', '강남금융센터'], ['000330', '해운대지점'], ['000412', '대전중앙지점']];
const VENDORS = ['에이텍', '효성티엔에스', '청호컴넷'];
const MODELS = ['ATM-3200', 'ATM-4100', '에이텍 STM', null];
const NAMES = ['김민준', '이서연', '박지호', '최수아', '정예준', '강하윤', '조도윤', '윤지우'];
const STATUSES: ApprovalStatus[] = ['REQ', 'APPROVED', 'REJECTED', 'CANCEL'];
const RESULTS = ['정상', '정상', '정상', '오류', '취소'];

/** 기준일(오늘) — 날짜 칸이 매일 같은 모양이 되도록 오늘에서 뺀다 */
const BASE = dayjs().startOf('day');

/** 표 시연 행 36건 */
export const DEMO_ROWS: DemoRow[] = (() => {
  const rng = createRng(20261107);
  const out: DemoRow[] = [];
  for (let i = 0; i < 36; i++) {
    const [ofcCode, kanm] = OFFICES[i % OFFICES.length];
    const mcnNo = String(Math.floor(i / OFFICES.length) + 1).padStart(3, '0');
    const cnt = rng.int(0, 400);
    out.push({
      id: `${ofcCode}-${mcnNo}`,
      ofcCode,
      kanm,
      mcnNo,
      vendNm: rng.pick(VENDORS),
      modelNm: rng.pick(MODELS),
      useYn: rng.chance(0.85) ? 'Y' : 'N',
      opYn: rng.chance(0.4) ? 'Y' : 'N',
      wrtDate: BASE.subtract(rng.int(0, 30), 'day').format('YYYYMMDD'),
      wrtTime: `${String(rng.int(0, 23)).padStart(2, '0')}${String(rng.int(0, 59)).padStart(2, '0')}${String(rng.int(0, 59)).padStart(2, '0')}`,
      amount: rng.int(0, 500) * 10000,
      cnt,
      rate: Math.round(rng.next() * 1000) / 10,
      telNo: `010${String(rng.int(10000000, 99999999))}`,
      acctNo: `301${String(rng.int(1000000000, 9999999999))}`,
      name: NAMES[i % NAMES.length],
      aprvStatus: rng.pick(STATUSES),
      result: rng.pick(RESULTS),
    });
  }
  return out;
})();

/** 표 편집(EditableGrid) 시연 행 — 기기모델코드처럼 코드·이름·사용여부·정렬순서 */
export interface EditDemoRow {
  /** 화면 안 행 키(새 행은 음수). 실제 화면은 PK 컬럼을 rowKey 로 */
  id: number;
  code: string;
  name: string;
  useYn: 'Y' | 'N';
  sortOrd: number;
  aplyDate: string;
  /** 금액 칸 시연(EditableGrid type 'amount') */
  unitPrc?: number;
}
export const EDIT_ROWS: EditDemoRow[] = [
  { id: 1, code: 'A1', name: 'ATM-3200', useYn: 'Y', sortOrd: 1, aplyDate: '20260101', unitPrc: 32000000 },
  { id: 2, code: 'A2', name: 'ATM-3500', useYn: 'Y', sortOrd: 2, aplyDate: '20260301', unitPrc: 35500000 },
  { id: 3, code: 'B1', name: '공과금수납기', useYn: 'Y', sortOrd: 3, aplyDate: '20260515', unitPrc: 12800000 },
  { id: 4, code: 'C1', name: '청호 ATM', useYn: 'N', sortOrd: 4, aplyDate: '20251201', unitPrc: 29000000 },
  { id: 5, code: 'S1', name: 'STM', useYn: 'Y', sortOrd: 5, aplyDate: '20260901', unitPrc: 48000000 },
];

/** 마스터(기기사) → 디테일(모델) 시연 */
export interface MasterRow {
  vendCode: string;
  vendNm: string;
}
export interface DetailRow {
  vendCode: string;
  modelCode: string;
  modelNm: string;
}
export const MASTER_ROWS: MasterRow[] = [
  { vendCode: '01', vendNm: '에이텍' },
  { vendCode: '02', vendNm: '효성티엔에스' },
  { vendCode: '03', vendNm: '청호컴넷' },
];
export const DETAIL_ROWS: DetailRow[] = [
  { vendCode: '01', modelCode: 'A1', modelNm: 'ATM-3200' },
  { vendCode: '01', modelCode: 'A2', modelNm: 'ATM-3500' },
  { vendCode: '01', modelCode: 'S1', modelNm: '에이텍 STM' },
  { vendCode: '02', modelCode: 'H1', modelNm: 'ATM-4100' },
  { vendCode: '02', modelCode: 'B1', modelNm: '공과금수납기' },
  { vendCode: '03', modelCode: 'C1', modelNm: '청호 ATM' },
];

/** 행렬표(MatrixGrid) — 사무소 × 기기구분 건수 */
export const MATRIX_ROWS = OFFICES.map(([ofcCode, kanm], i) => ({ key: ofcCode, label: `[${ofcCode}] ${kanm}`, group: i < 3 ? '수도권' : '지방' }));
export const MATRIX_COLS = [
  { key: 'ATM', label: 'ATM', children: [{ key: 'ATM_IN', label: '점내' }, { key: 'ATM_OUT', label: '점외' }] },
  { key: 'STM', label: 'STM' },
  { key: 'BILL', label: '공과금' },
];
const MATRIX_VALUES: Record<string, number> = (() => {
  const rng = createRng(1107);
  const m: Record<string, number> = {};
  OFFICES.forEach(([ofc]) => ['ATM_IN', 'ATM_OUT', 'STM', 'BILL'].forEach((c) => { m[`${ofc}|${c}`] = rng.int(0, 12); }));
  return m;
})();
export const matrixCell = (rowKey: string, colKey: string): number => MATRIX_VALUES[`${rowKey}|${colKey}`] ?? 0;

/* ---------- 가짜 요청(서버 없음) ---------- */
const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/** 원문 열람 데모 — 키(계좌번호 등 원문)를 그대로 돌려준다. 실제 화면은 서버가 권한 확인·열람 기록 후 원문을 준다 */
export const fakeUnmask = async (key: string, _reason: string): Promise<string> => {
  await wait(150);
  return key;
};

let fileSeq = 0;
/** 파일 올리기 데모 — 25% 씩 진행률을 올리고 가짜 fileId 를 준다 */
export const fakeUpload = async (file: File, onProgress: (percent: number) => void): Promise<UploadedFile> => {
  for (const p of [25, 50, 75, 100]) {
    await wait(60);
    onProgress(p);
  }
  fileSeq += 1;
  return { fileId: `DEMO${String(fileSeq).padStart(4, '0')}`, fileName: file.name, size: file.size };
};

/** 행 명령 데모 — 기번 끝자리가 홀수면 성공 */
export const fakeRowCommand = async (row: DemoRow): Promise<RowCommandResult> => {
  await wait(200);
  return Number(row.mcnNo) % 2 === 1 ? { ok: true, text: 'OK 12ms' } : { ok: false, text: '응답 없음' };
};

/** 명령 폴링 데모 — 발행 → PENDING → RUNNING → DONE */
let cmdSeq = 0;
const cmdPolls: Record<string, number> = {};
export const fakeIssue = async (): Promise<{ cmdId: string }> => {
  await wait(80);
  cmdSeq += 1;
  const cmdId = `CMD${String(cmdSeq).padStart(4, '0')}`;
  cmdPolls[cmdId] = 0;
  return { cmdId };
};
export const fakeStatus = async (cmdId: string): Promise<CommandStatus<{ elapsedMs: number }>> => {
  await wait(40);
  const n = (cmdPolls[cmdId] = (cmdPolls[cmdId] ?? 0) + 1);
  if (n < 2) return { state: 'PENDING', message: '기기 응답 대기' };
  if (n < 3) return { state: 'RUNNING', message: '처리 중' };
  return { state: 'DONE', message: '완료', result: { elapsedMs: n * 300 } };
};
