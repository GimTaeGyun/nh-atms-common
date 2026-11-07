package kr.co.nh.atms.web.common.auth;

/**
 * 현재 사용자(SecurityContext principal). {@link CurrentUserLoader} 가 고정 개인번호로 만든다(설계 §5.3).
 *
 * @param perNo      개인번호 TB_INSA.PER_NO
 * @param name       성명 TB_INSA.NAME
 * @param samuso     인사 사무소 TB_INSA.SAMUSO
 * @param samusoName 인사 사무소명 TB_INSA.SAMUSO_NAME
 * @param deptCode   권한 부서코드 TB_SCR_AUTH.DEPT_CODE (채택된 1행, 없으면 null)
 * @param ofcCode    권한 사무소코드 TB_SCR_AUTH.OFC_CODE (〃)
 * @param kanm       ofcCode 의 사무소명 TB_OFC_REG_MGT.KANM
 * @param auth       권한코드 TB_SCR_AUTH.AUTH (〃)
 * @param adminYn    관리자 여부 'Y'/'N' — {@link CurrentUserLoader#adminYnOf}
 */
public record LoginUser(String perNo, String name, String samuso, String samusoName,
                        String deptCode, String ofcCode, String kanm, String auth, String adminYn) {

    public boolean isAdmin() {
        return "Y".equals(adminYn);
    }
}
