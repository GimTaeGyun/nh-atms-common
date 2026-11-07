/**
 * 나(고정 사용자) — `GET /api/me` 응답. API 계약 §1 `Me` 와 글자 하나까지 같다.
 * 로그인이 없다(설계 Q1): 서버 설정의 개인번호로 TB_INSA·TB_SCR_AUTH 를 읽어 돌려준다.
 */
export interface Me {
  /** TB_INSA.PER_NO */
  perNo: string;
  /** TB_INSA.NAME */
  name: string;
  /** TB_INSA.SAMUSO */
  samuso: string | null;
  /** TB_INSA.SAMUSO_NAME */
  samusoName: string | null;
  /** TB_SCR_AUTH.DEPT_CODE (채택된 1행) */
  deptCode: string | null;
  /** TB_SCR_AUTH.OFC_CODE (채택된 1행) — 조회조건 기본 사무소 */
  ofcCode: string | null;
  /** TB_OFC_REG_MGT.KANM (ofcCode 의 사무소명) */
  kanm: string | null;
  /** TB_SCR_AUTH.AUTH */
  auth: string | null;
  /** 잠정: AUTH='A' 이면 Y (서버 CurrentUserLoader 한 곳) */
  adminYn: 'Y' | 'N';
}
