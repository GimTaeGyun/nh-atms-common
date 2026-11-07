package kr.co.nh.atms.web.common.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** TB_SCR_AUTH_MENU 권한 플래그 5개(화면 1개 × 권한코드 1개) */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MenuAuthFlags {
    private String qryRolYn;
    private String regRolYn;
    private String updRolYn;
    private String delRolYn;
    private String exeRolYn;

    /** 해당 권한이 'Y' 인지 */
    public boolean allows(Perm perm) {
        String v = switch (perm) {
            case QRY -> qryRolYn;
            case REG -> regRolYn;
            case UPD -> updRolYn;
            case DEL -> delRolYn;
            case EXE -> exeRolYn;
        };
        return v != null && "Y".equals(v.trim());
    }
}
