package kr.co.nh.atms.web.mcninfo.controller;

import jakarta.validation.Valid;
import kr.co.nh.atms.common.page.PageResult;
import kr.co.nh.atms.common.response.ApiResponse;
import kr.co.nh.atms.web.common.auth.Perm;
import kr.co.nh.atms.web.common.auth.RequireMenuAuth;
import kr.co.nh.atms.web.mcninfo.dto.McnInfo;
import kr.co.nh.atms.web.mcninfo.dto.McnInfoSave;
import kr.co.nh.atms.web.mcninfo.dto.McnInfoSearchDto;
import kr.co.nh.atms.web.mcninfo.service.McnInfoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * 기기정보 견본(화면키 sample.mcnInfo) — API 계약 §4. 조회는 message null, 쓰기는 응답코드 문구(S002·S003·S004).
 * 화면 권한을 서버에서 다시 검사한다 — 계약 표 그대로 조회 QRY·등록 REG·수정 UPD·삭제 DEL(@RequireMenuAuth → 없으면 403 SYS_403).
 */
@RestController
@RequiredArgsConstructor
public class McnInfoController {

    /** 화면키(screens/screenIds.ts) — 권한 검사의 메뉴 경로 원천 */
    static final String SCREEN = "sample.mcnInfo";

    private final McnInfoService service;

    @RequireMenuAuth(screen = SCREEN, need = Perm.QRY)
    @GetMapping("/api/mcn-info")
    public ApiResponse<PageResult<McnInfo>> list(@ModelAttribute McnInfoSearchDto search) {
        return ApiResponse.ok(service.list(search));
    }

    @RequireMenuAuth(screen = SCREEN, need = Perm.QRY)
    @GetMapping("/api/mcn-info/{ofcCode}/{mcnNo}")
    public ApiResponse<McnInfo> get(@PathVariable String ofcCode, @PathVariable String mcnNo) {
        return ApiResponse.ok(service.get(ofcCode, mcnNo));
    }

    @RequireMenuAuth(screen = SCREEN, need = Perm.REG)
    @PostMapping("/api/mcn-info")
    public ApiResponse<McnInfo> create(@RequestBody @Valid McnInfoSave body) {
        return ApiResponse.ok(service.create(body), "S002");
    }

    @RequireMenuAuth(screen = SCREEN, need = Perm.UPD)
    @PutMapping("/api/mcn-info/{ofcCode}/{mcnNo}")
    public ApiResponse<McnInfo> update(@PathVariable String ofcCode, @PathVariable String mcnNo, @RequestBody @Valid McnInfoSave body) {
        return ApiResponse.ok(service.update(ofcCode, mcnNo, body), "S003");
    }

    @RequireMenuAuth(screen = SCREEN, need = Perm.DEL)
    @DeleteMapping("/api/mcn-info/{ofcCode}/{mcnNo}")
    public ApiResponse<Void> delete(@PathVariable String ofcCode, @PathVariable String mcnNo) {
        service.delete(ofcCode, mcnNo);
        return ApiResponse.ok(null, "S004");
    }
}
