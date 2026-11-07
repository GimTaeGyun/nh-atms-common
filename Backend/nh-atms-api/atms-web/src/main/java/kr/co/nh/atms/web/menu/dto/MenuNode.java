package kr.co.nh.atms.web.menu.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/**
 * 내 메뉴 트리 노드 — API 계약 §1 {@code MenuNode}. TB_SCR_MENU 컬럼 + TB_SCR_AUTH_MENU 권한 플래그 5개.
 * 조회 SQL 결과(평면 행)에도 그대로 쓰고, {@code children} 은 서비스가 채운다.
 */
@Getter
@Setter
public class MenuNode {
    private String menuId;
    private String parentMenuId;
    private String menuNm;
    /** G 그룹, M 화면 */
    private String menuType;
    /** 화면 경로 '/sample/notice' (화면키 연결, 잠정 Q-05) */
    private String menuPath;
    private Integer sortNo;
    private String useYn;
    private String qryRolYn;
    private String regRolYn;
    private String updRolYn;
    private String delRolYn;
    private String exeRolYn;
    private List<MenuNode> children = new ArrayList<>();
}
