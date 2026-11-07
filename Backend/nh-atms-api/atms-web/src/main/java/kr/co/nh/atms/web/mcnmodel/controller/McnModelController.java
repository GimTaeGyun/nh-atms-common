package kr.co.nh.atms.web.mcnmodel.controller;

import jakarta.validation.Valid;
import kr.co.nh.atms.common.response.ApiResponse;
import kr.co.nh.atms.web.common.BatchChanges;
import kr.co.nh.atms.web.common.auth.Perm;
import kr.co.nh.atms.web.common.auth.RequireMenuAuth;
import kr.co.nh.atms.web.mcnmodel.dto.McnModel;
import kr.co.nh.atms.web.mcnmodel.dto.McnModelBatchResult;
import kr.co.nh.atms.web.mcnmodel.dto.McnModelSearchDto;
import kr.co.nh.atms.web.mcnmodel.service.McnModelService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 기기모델코드 견본(화면키 sample.mcnModel) — API 계약 §5. 조회는 message null(QRY), 일괄 저장은 S001.
 * 일괄 저장은 한 요청에 권한이 여럿(추가 REG·수정 UPD·삭제 DEL) 필요해서 @RequireMenuAuth 대신
 * McnModelService.saveBatch 가 들어온 종류만 MenuAuthService.check 로 검사한다(없으면 403 SYS_403).
 */
@RestController
@RequiredArgsConstructor
public class McnModelController {

    private final McnModelService service;

    @RequireMenuAuth(screen = McnModelService.SCREEN, need = Perm.QRY)
    @GetMapping("/api/mcn-model")
    public ApiResponse<List<McnModel>> list(@ModelAttribute McnModelSearchDto search) {
        return ApiResponse.ok(service.list(search));
    }

    @PostMapping("/api/mcn-model/batch")
    public ApiResponse<McnModelBatchResult> saveBatch(@RequestBody @Valid BatchChanges<McnModel> body) {
        return ApiResponse.ok(service.saveBatch(body), "S001");
    }
}
