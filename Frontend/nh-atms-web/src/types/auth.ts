export type RoleId = 'ADMIN' | 'USER' | 'VENDOR' | 'CALLCENTER' | string;

export interface UserInfo {
  userId: string;
  userName: string;
  deptName: string;
  roleId: RoleId;
  /** 로그인 사무소(영업점) 코드 — AS-IS 000080 */
  officeCd?: string;
  officeName?: string;
  /** 접근등급 1~N (낮을수록 상위) */
  accessGrade?: number;
  adminYn?: 'Y' | 'N';
  clientIp?: string;
}

export interface LoginRequest {
  userId: string;
  password: string;
}

/**
 * 로그인 방식 — LOCAL: 아이디/비밀번호(용역업체), SSO: 통합업무시스템에서 통합로그인 Ticket 으로 진입(현업).
 * 세션이 끝난 뒤 어디로 보낼지(로그인 화면 / 재연결 안내) 가르는 기준. 설계 `Document/3.구현계획/18_SSO_통합로그인_진입_설계.md`
 */
export type LoginType = 'LOCAL' | 'SSO';

/** 통합UI 링크(새창)로 받은 1회용 Ticket 을 ATMS 세션으로 바꾼다 */
export interface SsoLoginRequest {
  ticket: string;
}

/** 폼 POST 진입 뒤 백엔드가 302 로 붙여 준 일회 코드를 ATMS 세션으로 바꾼다 */
export interface SsoExchangeRequest {
  code: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** access 만료 epoch(ms). 없으면 JWT exp 를 디코드 */
  accessExpiresAt?: number;
}

export interface LoginResponse extends TokenPair {
  user: UserInfo;
  /** 백엔드가 알려주는 로그인 방식. 없으면 LOCAL 로 본다 */
  loginType?: LoginType;
}
