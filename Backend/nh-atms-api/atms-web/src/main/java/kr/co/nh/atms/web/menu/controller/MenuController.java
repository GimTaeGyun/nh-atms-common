package kr.co.nh.atms.web.menu.controller;

import kr.co.nh.atms.common.response.ApiResponse;
import kr.co.nh.atms.web.menu.dto.MenuNode;
import kr.co.nh.atms.web.menu.service.MenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** 내 메뉴 트리 (API 계약 §1) */
@RestController
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    @GetMapping("/api/menu/my")
    public ApiResponse<List<MenuNode>> my() {
        return ApiResponse.ok(menuService.myMenus());
    }
}
