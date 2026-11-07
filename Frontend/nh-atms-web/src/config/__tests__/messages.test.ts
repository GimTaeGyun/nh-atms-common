import { describe, expect, it } from 'vitest';
import { CMSG, josa, VMSG } from '@/config/messages';

describe('config/messages', () => {
  it('받침에 맞춰 조사를 고른다', () => {
    expect(josa('사무소', '을/를')).toBe('를');
    expect(josa('기번', '을/를')).toBe('을');
    expect(josa('장소명(위치설명)', '을/를')).toBe('을');
    expect(josa('등록 사유', '을/를')).toBe('를');
    expect(josa('비밀번호', '은/는')).toBe('는');
    expect(josa('종료일', '은/는')).toBe('은');
    expect(josa('서울', '으로/로')).toBe('로');
    expect(josa('본점', '으로/로')).toBe('으로');
    expect(josa('3', '을/를')).toBe('을');
    expect(josa('2', '을/를')).toBe('를');
    expect(josa('ID', '을/를')).toBe('을(를)');
  });

  it('검증 문구는 조사·마침표가 맞다', () => {
    expect(VMSG.required('사무소')).toBe('사무소를 입력하세요.');
    expect(VMSG.required('운영기기')).toBe('운영기기를 입력하세요.');
    expect(VMSG.select('기번')).toBe('기번을 선택하세요.');
    expect(VMSG.selectAtLeastOne('지역본부')).toBe('지역본부를 1개 이상 선택하세요.');
    expect(VMSG.minValue('점수', 0)).toBe('점수는 0 이상이어야 합니다.');
    expect(VMSG.notBefore('사유발생 종료일시', '시작일시')).toBe('사유발생 종료일시는 시작일시보다 빠를 수 없습니다.');
    expect(VMSG.periodMax(31)).toBe('조회 기간은 최대 31일까지 가능합니다.');
  });

  it('확인창 문구는 "~하시겠습니까?" 로 통일되고 대괄호 뒤 조사도 맞다', () => {
    expect(CMSG.deleteTarget('첨부파일')).toBe('첨부파일을 삭제하시겠습니까?');
    expect(CMSG.deleteTarget('코드구분 [AB]')).toBe('코드구분 [AB]을 삭제하시겠습니까?');
    expect(CMSG.deleteTarget('코너 [001] 본점')).toBe('코너 [001] 본점을 삭제하시겠습니까?');
    expect(CMSG.deleteTarget("'홍길동(hong)' 사용자")).toBe("'홍길동(hong)' 사용자를 삭제하시겠습니까?");
    expect(CMSG.deleteSelected(3)).toBe('선택한 3건을 삭제하시겠습니까?');
    expect(CMSG.deleteSelected(2, '장애이력', '삭제(SLA 집계 제외)')).toBe('선택한 2건의 장애이력을 삭제(SLA 집계 제외)하시겠습니까?');
  });
});
