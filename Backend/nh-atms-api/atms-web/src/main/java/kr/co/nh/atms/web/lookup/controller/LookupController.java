package kr.co.nh.atms.web.lookup.controller;

import kr.co.nh.atms.common.response.ApiResponse;
import kr.co.nh.atms.web.lookup.dto.Code;
import kr.co.nh.atms.web.lookup.dto.Corner;
import kr.co.nh.atms.web.lookup.dto.DistinctValue;
import kr.co.nh.atms.web.lookup.dto.Holiday;
import kr.co.nh.atms.web.lookup.dto.Machine;
import kr.co.nh.atms.web.lookup.dto.Model;
import kr.co.nh.atms.web.lookup.dto.Office;
import kr.co.nh.atms.web.lookup.dto.Person;
import kr.co.nh.atms.web.lookup.dto.Sido;
import kr.co.nh.atms.web.lookup.dto.Sigun;
import kr.co.nh.atms.web.lookup.dto.Vendor;
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
    public ApiResponse<List<Office>> offices(@RequestParam(required = false) String q) {
        return ApiResponse.ok(service.offices(q));
    }

    @GetMapping("/api/lookup/offices/{ofcCode}")
    public ApiResponse<Office> office(@PathVariable String ofcCode) {
        return ApiResponse.ok(service.office(ofcCode));
    }

    @GetMapping("/api/lookup/persons")
    public ApiResponse<List<Person>> persons(@RequestParam(required = false) String ofcCode,
                                             @RequestParam(required = false) String q) {
        return ApiResponse.ok(service.persons(ofcCode, q));
    }

    @GetMapping("/api/lookup/persons/{perNo}")
    public ApiResponse<Person> person(@PathVariable String perNo) {
        return ApiResponse.ok(service.person(perNo));
    }

    @GetMapping("/api/lookup/vendors")
    public ApiResponse<List<Vendor>> vendors() {
        return ApiResponse.ok(service.vendors());
    }

    @GetMapping("/api/lookup/models")
    public ApiResponse<List<Model>> models(@RequestParam(required = false) String vendCode,
                                           @RequestParam(required = false) String mcnType) {
        return ApiResponse.ok(service.models(vendCode, mcnType));
    }

    @GetMapping("/api/lookup/machines")
    public ApiResponse<List<Machine>> machines(@RequestParam(required = false) String ofcCode,
                                               @RequestParam(required = false) String vendCode,
                                               @RequestParam(required = false) String q) {
        return ApiResponse.ok(service.machines(ofcCode, vendCode, q));
    }

    @GetMapping("/api/lookup/corners")
    public ApiResponse<List<Corner>> corners(@RequestParam(required = false) String ofcCode) {
        return ApiResponse.ok(service.corners(ofcCode));
    }

    @GetMapping("/api/lookup/codes/{codeType}")
    public ApiResponse<List<Code>> codes(@PathVariable String codeType) {
        return ApiResponse.ok(service.codes(codeType));
    }

    @GetMapping("/api/lookup/distinct/{target}")
    public ApiResponse<List<DistinctValue>> distinct(@PathVariable String target) {
        return ApiResponse.ok(service.distinct(target));
    }

    @GetMapping("/api/lookup/sido")
    public ApiResponse<List<Sido>> sido() {
        return ApiResponse.ok(service.sido());
    }

    @GetMapping("/api/lookup/sigun")
    public ApiResponse<List<Sigun>> sigun(@RequestParam(required = false) String sidoCode) {
        return ApiResponse.ok(service.sigun(sidoCode));
    }

    @GetMapping("/api/lookup/holidays")
    public ApiResponse<List<Holiday>> holidays(@RequestParam(required = false) String from,
                                               @RequestParam(required = false) String to) {
        return ApiResponse.ok(service.holidays(from, to));
    }
}
