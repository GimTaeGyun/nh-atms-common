package kr.co.nh.atms.web.notice.controller;

import jakarta.validation.Valid;
import kr.co.nh.atms.common.page.PageResult;
import kr.co.nh.atms.common.response.ApiResponse;
import kr.co.nh.atms.web.common.Yn;
import kr.co.nh.atms.web.common.auth.Perm;
import kr.co.nh.atms.web.common.auth.RequireMenuAuth;
import kr.co.nh.atms.web.notice.dto.Notice;
import kr.co.nh.atms.web.notice.dto.NoticeDeleteRequest;
import kr.co.nh.atms.web.notice.dto.NoticeDeleteResult;
import kr.co.nh.atms.web.notice.dto.NoticeSave;
import kr.co.nh.atms.web.notice.dto.NoticeSearchDto;
import kr.co.nh.atms.web.notice.service.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 공지사항 견본 API — API 계약 §3 (화면키 sample.notice, 화면 경로 /sample/notice).
 * 권한은 계약 표 그대로 메서드마다 {@code @RequireMenuAuth}(조회 QRY·등록 REG·수정 UPD·삭제 DEL, 없으면 403 SYS_403).
 */
@RestController
@RequiredArgsConstructor
public class NoticeController {

    /** 화면키(screens/screenIds.ts) */
    static final String SCREEN = "sample.notice";

    private final NoticeService service;

    @RequireMenuAuth(screen = SCREEN, need = Perm.QRY)
    @GetMapping("/api/notice")
    public ApiResponse<PageResult<Notice>> list(@ModelAttribute NoticeSearchDto s) {
        return ApiResponse.ok(service.search(s));
    }

    /** hit=Y 이면 조회수 +1 (상세 팝업 열기) */
    @RequireMenuAuth(screen = SCREEN, need = Perm.QRY)
    @GetMapping("/api/notice/{no}")
    public ApiResponse<Notice> get(@PathVariable long no, @RequestParam(required = false) String hit) {
        return ApiResponse.ok(service.get(no, Yn.is(hit)));
    }

    @RequireMenuAuth(screen = SCREEN, need = Perm.REG)
    @PostMapping("/api/notice")
    public ApiResponse<Notice> create(@RequestBody @Valid NoticeSave req) {
        return ApiResponse.ok(service.create(req), "S002");
    }

    @RequireMenuAuth(screen = SCREEN, need = Perm.UPD)
    @PutMapping("/api/notice/{no}")
    public ApiResponse<Notice> update(@PathVariable long no, @RequestBody @Valid NoticeSave req) {
        return ApiResponse.ok(service.update(no, req), "S003");
    }

    @RequireMenuAuth(screen = SCREEN, need = Perm.DEL)
    @PostMapping("/api/notice/delete")
    public ApiResponse<NoticeDeleteResult> delete(@RequestBody NoticeDeleteRequest req) {
        NoticeDeleteResult r = service.delete(req);
        return ApiResponse.ok(r, "S005", r.getCount());
    }
}
