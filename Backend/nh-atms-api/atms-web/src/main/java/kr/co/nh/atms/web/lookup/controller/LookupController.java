package kr.co.nh.atms.web.lookup.controller;

import kr.co.nh.atms.common.response.ApiResponse;
import kr.co.nh.atms.web.lookup.dto.LookupCode;
import kr.co.nh.atms.web.lookup.dto.LookupCorner;
import kr.co.nh.atms.web.lookup.dto.LookupDistinctValue;
import kr.co.nh.atms.web.lookup.dto.LookupHoliday;
import kr.co.nh.atms.web.lookup.dto.LookupMachine;
import kr.co.nh.atms.web.lookup.dto.LookupModel;
import kr.co.nh.atms.web.lookup.dto.LookupOffice;
import kr.co.nh.atms.web.lookup.dto.LookupPerson;
import kr.co.nh.atms.web.lookup.dto.LookupSido;
import kr.co.nh.atms.web.lookup.dto.LookupSigun;
import kr.co.nh.atms.web.lookup.dto.LookupSrc;
import kr.co.nh.atms.web.lookup.dto.LookupVendor;
import kr.co.nh.atms.web.lookup.service.LookupService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 공통 조회 API(콤보·팝업 원천) — API 계약 §2. 모두 GET, 조회 응답이라 message 는 null.
 * 필수 파라미터 검사는 서비스가 응답코드로 한다(V001_20·LKP_001·VAL_002 등).
 */
@RestController
@RequiredArgsConstructor
public class LookupController {

    private final LookupService service;

    @GetMapping("/api/lookup/offices")
    public ApiResponse<List<LookupOffice>> offices(@RequestParam(required = false) String q) {
        return ApiResponse.ok(service.offices(q));
    }

    @GetMapping("/api/lookup/offices/{ofcCode}")
    public ApiResponse<LookupOffice> office(@PathVariable String ofcCode) {
        return ApiResponse.ok(service.office(ofcCode));
    }

    @GetMapping("/api/lookup/persons")
    public ApiResponse<List<LookupPerson>> persons(@RequestParam(required = false) String ofcCode,
                                             @RequestParam(required = false) String q) {
        return ApiResponse.ok(service.persons(ofcCode, q));
    }

    @GetMapping("/api/lookup/persons/{perNo}")
    public ApiResponse<LookupPerson> person(@PathVariable String perNo) {
        return ApiResponse.ok(service.person(perNo));
    }

    @GetMapping("/api/lookup/vendors")
    public ApiResponse<List<LookupVendor>> vendors() {
        return ApiResponse.ok(service.vendors());
    }

    @GetMapping("/api/lookup/models")
    public ApiResponse<List<LookupModel>> models(@RequestParam(required = false) String vendCode,
                                           @RequestParam(required = false) String mcnType) {
        return ApiResponse.ok(service.models(vendCode, mcnType));
    }

    @GetMapping("/api/lookup/srcs")
    public ApiResponse<List<LookupSrc>> srcs(@RequestParam(required = false) String vendCode) {
        return ApiResponse.ok(service.srcs(vendCode));
    }

    @GetMapping("/api/lookup/machines")
    public ApiResponse<List<LookupMachine>> machines(@RequestParam(required = false) String ofcCode,
                                               @RequestParam(required = false) String vendCode,
                                               @RequestParam(required = false) String q) {
        return ApiResponse.ok(service.machines(ofcCode, vendCode, q));
    }

    @GetMapping("/api/lookup/corners")
    public ApiResponse<List<LookupCorner>> corners(@RequestParam(required = false) String ofcCode) {
        return ApiResponse.ok(service.corners(ofcCode));
    }

    @GetMapping("/api/lookup/codes/{codeType}")
    public ApiResponse<List<LookupCode>> codes(@PathVariable String codeType) {
        return ApiResponse.ok(service.codes(codeType));
    }

    @GetMapping("/api/lookup/distinct/{target}")
    public ApiResponse<List<LookupDistinctValue>> distinct(@PathVariable String target) {
        return ApiResponse.ok(service.distinct(target));
    }

    @GetMapping("/api/lookup/sido")
    public ApiResponse<List<LookupSido>> sido() {
        return ApiResponse.ok(service.sido());
    }

    @GetMapping("/api/lookup/sigun")
    public ApiResponse<List<LookupSigun>> sigun(@RequestParam(required = false) String sidoCode) {
        return ApiResponse.ok(service.sigun(sidoCode));
    }

    @GetMapping("/api/lookup/holidays")
    public ApiResponse<List<LookupHoliday>> holidays(@RequestParam(required = false) String from,
                                               @RequestParam(required = false) String to) {
        return ApiResponse.ok(service.holidays(from, to));
    }
}
