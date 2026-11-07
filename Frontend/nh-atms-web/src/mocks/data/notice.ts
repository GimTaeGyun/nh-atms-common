/**
 * 공지사항 견본(`sample.notice`) 목 데이터 — 응답 모양은 domain/notice.ts(API 계약 §3).
 * createRng 로 같은 날에는 늘 같은 값. 작성일은 오늘 기준 0~95일 전에 흩어 두어 기본 조건(최근 1개월)에도 행이 보인다.
 * 컬럼 길이(db/ddl/TB_NOTICE.sql): OFC_CODE CHAR(6), SUBJECT 200바이트, TEXT 4000바이트, NAME 10바이트, PER_NO 9자.
 * 목 핸들러가 등록·수정·삭제로 바꾸는 배열이다 — 테스트는 resetMockNotices() 로 처음 상태로 되돌린다.
 */
import type { Notice } from '@/domain/notice';
import { createRng } from '@/utils/random';
import { dayjs } from '@/utils/date';
import { OFFICES, PERSONS, ME_PERSON } from './lookup';

/** 목 데이터 건수 */
export const NOTICE_COUNT = 42;

const TOPICS = ['정기 점검', '시스템 작업', '현금 보충', '기기 교체', '보안 패치', '장애 조치', '운영시간 변경', '전산 교육', '연휴 운영', '코너 이전'];
const SUFFIX = ['안내', '공지', '협조 요청', '일정 알림', '결과 공유'];
const BODY = [
  '아래와 같이 작업이 예정되어 있으니 업무에 참고하시기 바랍니다.',
  '작업 시간 동안 해당 기기의 거래가 일시 중지될 수 있습니다.',
  '문의는 테크부문 운영 담당자에게 연락 바랍니다.',
  '세부 일정은 사정에 따라 바뀔 수 있습니다.',
];

const pad14 = (ymd: string, hms: string) => `${ymd}${hms}`;

/** 오늘 기준으로 결정적인 목록을 만든다(NO 큰 것이 최근) */
const buildNotices = (): Notice[] => {
  const rng = createRng(20261107);
  const today = dayjs().startOf('day');
  // NO 1 이 가장 오래된 글: 95일 전부터 오늘까지 고르게(같은 날 여러 건 가능)
  const offsets = Array.from({ length: NOTICE_COUNT }, (_, i) => Math.round(((NOTICE_COUNT - 1 - i) * 95) / (NOTICE_COUNT - 1)));
  return offsets.map((off, i) => {
    const no = i + 1;
    const wrt = today.subtract(off, 'day');
    const wrtDate = wrt.format('YYYYMMDD');
    // 5건에 1건은 사무소 없는 글(OFC_CODE NULL), 나머지는 사무소 목록에서 — 내 사무소(000080) 글이 넉넉히 나오게 앞쪽 가중
    const office = no % 5 === 0 ? null : rng.chance(0.45) ? OFFICES[0] : rng.pick(OFFICES);
    const people = office ? PERSONS.filter((p) => p.samuso === office.ofcCode) : [ME_PERSON];
    const writer = people.length ? rng.pick(people) : ME_PERSON;
    const topic = rng.pick(TOPICS);
    const subject = `[${wrt.format('MM/DD')}] ${topic} ${rng.pick(SUFFIX)}`;
    const lines = [`${topic} 관련 안내입니다.`, ...BODY.filter(() => rng.chance(0.6))];
    const crtHms = `${String(rng.int(8, 17)).padStart(2, '0')}${String(rng.int(0, 59)).padStart(2, '0')}00`;
    const edited = rng.chance(0.3);
    const lsDate = edited ? wrt.add(rng.int(0, Math.min(off, 3)), 'day').format('YYYYMMDD') : wrtDate;
    return {
      no,
      ofcCode: office?.ofcCode ?? null,
      kanm: office?.kanm ?? null,
      subject,
      text: lines.join('\n'),
      visit: rng.int(0, 180),
      name: writer.name,
      perNo: writer.perNo,
      wrtDate,
      crtDtm: pad14(wrtDate, crtHms),
      crtCmeno: writer.perNo,
      lschgDtm: pad14(lsDate, edited ? '180000' : crtHms),
      lsCmeno: writer.perNo,
    };
  });
};

/** 목 저장소(핸들러가 바꾼다) */
export const NOTICES: Notice[] = buildNotices();

/** 테스트용: 처음 상태로 되돌리기 */
export const resetMockNotices = (): void => {
  NOTICES.splice(0, NOTICES.length, ...buildNotices());
};
