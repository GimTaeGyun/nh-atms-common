/**
 * 화면 문구 — 서버에 보내기 전에 화면이 먼저 막을 때 쓰는 검증 문구(VMSG)와 확인창 문구(CMSG)를 이 파일 한 곳에 모은다.
 *
 * - 서버가 막은 결과(업무 오류·저장 완료 등)는 서버 문구를 그대로 띄운다(응답코드 테이블 T_API_MESSAGE, 25 문서).
 *   여기에는 "보내기 전" 문구만 둔다: 폼 칸 아래 빨간 글씨, 조회·저장 버튼을 누른 직후 경고.
 * - 조사는 받침에 맞춰 자동으로 붙인다(`사무소` → 사무소를, `기번` → 기번을). 문장 끝은 마침표.
 * - 같은 검사를 서버도 하면(예: 필수값) 서버 테이블 문장과 같게 맞춘다.
 *
 * 사용: `{ required: true, message: VMSG.required('사무소') }` · `message.warning(VMSG.select('기번'))`
 */

type JosaPair = '을/를' | '은/는' | '이/가' | '으로/로' | '과/와';

/** 숫자 끝 글자의 받침 여부(영 일 이 삼 사 오 육 칠 팔 구) */
const DIGIT_BATCHIM: Record<string, boolean> = { '0': true, '1': true, '2': false, '3': true, '4': false, '5': false, '6': true, '7': true, '8': true, '9': false };

/**
 * 받침에 맞는 조사. 끝의 괄호·대괄호는 건너뛴다(`장소명(위치설명)` → `명`, `코드구분 [AB]` → `분` 기준).
 * 한글·숫자가 아니면(영문 등) `을(를)` 처럼 둘 다 적는다.
 */
export const josa = (word: string, pair: JosaPair): string => {
  const [withBatchim, without] = pair.split('/') as [string, string];
  const base = word.replace(/(\s*(\([^)]*\)|\[[^\]]*\]))+\s*$/, '').trim();
  const last = base.charAt(base.length - 1);
  const code = last.charCodeAt(0);
  let batchim: number | null = null; // 0 = 없음, 그 밖 = 받침 번호
  if (code >= 0xac00 && code <= 0xd7a3) batchim = (code - 0xac00) % 28;
  else if (last in DIGIT_BATCHIM) batchim = DIGIT_BATCHIM[last] ? (last === '1' || last === '7' || last === '8' ? 8 : 1) : 0;
  if (batchim === null) return `${withBatchim}(${without})`;
  // '으로/로' 는 ㄹ 받침(8) 뒤에도 '로'
  if (pair === '으로/로') return batchim === 0 || batchim === 8 ? without : withBatchim;
  return batchim === 0 ? without : withBatchim;
};

/** 단어 + 조사 */
const w = (word: string, pair: JosaPair): string => `${word}${josa(word, pair)}`;

export const VMSG = {
  /* ── 공통 틀 ── */
  /** 사무소를 입력하세요. */
  required: (label: string) => `${w(label, '을/를')} 입력하세요.`,
  /** 기번을 선택하세요. */
  select: (label: string) => `${w(label, '을/를')} 선택하세요.`,
  /** 실행 대상을 체크하세요. */
  check: (label: string) => `${w(label, '을/를')} 체크하세요.`,
  /** 조회항목을 1개 이상 선택하세요. */
  selectAtLeastOne: (label: string) => `${w(label, '을/를')} 1개 이상 선택하세요.`,
  /** 5자 이상 입력하세요. */
  minLength: (n: number) => `${n}자 이상 입력하세요.`,
  /** 점수는 0 이상이어야 합니다. */
  minValue: (label: string, min: number) => `${w(label, '은/는')} ${min} 이상이어야 합니다.`,
  /** 용역관리 종료일은 시작일 이후여야 합니다. */
  after: (later: string, earlier: string) => `${w(later, '은/는')} ${earlier} 이후여야 합니다.`,
  /** 사유발생 종료일시는 시작일시보다 빠를 수 없습니다. */
  notBefore: (later: string, earlier: string) => `${w(later, '은/는')} ${earlier}보다 빠를 수 없습니다.`,
  /** 불량건수는 총평가항목건수를 넘을 수 없습니다. */
  notOver: (label: string, limit: string) => `${w(label, '은/는')} ${w(limit, '을/를')} 넘을 수 없습니다.`,
  /** 삭제 개월은 보관 개월 이상이어야 합니다. */
  atLeast: (label: string, other: string) => `${w(label, '은/는')} ${other} 이상이어야 합니다.`,
  /** 기기 리스트에서 기번을 선택하세요. */
  selectFrom: (where: string, label: string) => `${where}에서 ${w(label, '을/를')} 선택하세요.`,
  /** 등록요청자 개인번호를 입력 후 엔터키를 눌러 성명을 확인하세요. */
  personLookup: (label: string) => `${label} 개인번호를 입력 후 엔터키를 눌러 성명을 확인하세요.`,

  /* ── 기간 ── */
  /** 종료일이 시작일보다 빠릅니다. */
  periodOrder: '종료일이 시작일보다 빠릅니다.',
  /** 조회 기간은 최대 31일까지 가능합니다. */
  periodMax: (days: number) => `조회 기간은 최대 ${days}일까지 가능합니다.`,
  /** 최대 10일 전까지 조회 가능합니다. */
  daysBackMax: (days: number) => `최대 ${days}일 전까지 조회 가능합니다.`,
  /** 미래 일자는 조회할 수 없습니다. */
  noFuture: '미래 일자는 조회할 수 없습니다.',

  /* ── 형식 ── */
  /** 20자 이내로 입력하세요. */
  maxLength: (n: number) => `${n}자 이내로 입력하세요.`,
  /** 숫자 3자리로 입력하세요. */
  digits: (n: number) => `숫자 ${n}자리로 입력하세요.`,
  numeric: '숫자만 입력하세요.',
  number: '숫자를 입력하세요.',
  /** 1 ~ 99 사이로 입력하세요. · 0 이상으로 입력하세요. · 99 이하로 입력하세요. */
  between: (min: number, max: number) => `${min} ~ ${max} 사이로 입력하세요.`,
  minInput: (min: number) => `${min} 이상으로 입력하세요.`,
  maxInput: (max: number) => `${max} 이하로 입력하세요.`,
  phone: '전화번호 형식이 아닙니다. (예: 02-1234-5678)',
  passwordConfirm: '비밀번호를 한 번 더 입력하세요.',
  passwordMismatch: '비밀번호가 일치하지 않습니다.',
  passwordRule: '영문·숫자·특수문자를 모두 포함하세요.',
  userIdChars: '영문·숫자·._- 만 입력하세요.',
  /** 영문 대문자/숫자/_ 2~20자로 입력하세요. */
  codeUpper: (min: number, max: number) => `영문 대문자/숫자/_ ${min}~${max}자로 입력하세요.`,
  /** 코드는 숫자 2자리로 입력하세요. */
  digitsOnly: (label: string, len: number) => `${w(label, '은/는')} 숫자 ${len}자리로 입력하세요.`,
  /** 등급은 영문 대문자 1자로 입력하세요. */
  upperLetters: (label: string, len: number) => `${w(label, '은/는')} 영문 대문자 ${len}자로 입력하세요.`,

  /* ── 파일 ── */
  fileType: (name: string) => `[${name}] 허용되지 않는 파일 형식입니다.`,
  fileSize: (name: string, mb: number) => `[${name}] 파일 크기가 ${mb}MB 를 초과합니다.`,
  fileCount: (max: number) => `첨부파일은 최대 ${max}개까지 등록할 수 있습니다.`,

  /* ── 그 밖의 사전 검사 ── */
  noChanges: '변경된 내용이 없습니다.',
} as const;

/**
 * 확인창 문구(Popconfirm·modal.confirm·ActionBar confirm). 말투는 "~하시겠습니까?" 하나로.
 * 사용: `<Popconfirm title={CMSG.deleteTarget(`코너 [${c.cornerCd}] ${c.cornerName}`)} …>`
 */
export const CMSG = {
  /** 삭제하시겠습니까? (ActionBar 삭제 버튼 기본) */
  delete: '삭제하시겠습니까?',
  /** 첨부파일을 삭제하시겠습니까? · 코너 [001] 본점을 삭제하시겠습니까? */
  deleteTarget: (target: string) => `${w(target, '을/를')} 삭제하시겠습니까?`,
  /** 이 홍보문구를 승인하시겠습니까? */
  approveTarget: (target: string) => `${w(target, '을/를')} 승인하시겠습니까?`,
  /** 선택한 3건을 삭제하시겠습니까? · 선택한 3건의 C/S 이력을 삭제하시겠습니까? */
  deleteSelected: (n: number, what?: string, how = '삭제') => (what ? `선택한 ${n}건의 ${w(what, '을/를')} ${how}하시겠습니까?` : `선택한 ${n}건을 ${how}하시겠습니까?`),
  /** 이 메뉴를 삭제(사용안함)하시겠습니까? */
  menuDisable: '이 메뉴를 삭제(사용안함)하시겠습니까?',
} as const;
