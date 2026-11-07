package kr.co.nh.atms.web.mcnmodel.dto;

/**
 * 일괄 저장 결과 (API 계약 §5 {@code { added, updated, deleted }}) — 종류별 처리 건수.
 */
public record McnModelBatchResult(int added, int updated, int deleted) {}
