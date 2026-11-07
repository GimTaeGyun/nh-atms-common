package kr.co.nh.atms.common.message;

import kr.co.nh.atms.common.exception.BusinessException;
import kr.co.nh.atms.common.response.ApiResponse;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ApiMessagesTest {

    @Test
    void fillsPlaceholdersInOrder() {
        assertThat(ApiMessages.fill("{0}대에 {1} 명령을 전송했습니다.", 3, "일반리셋")).isEqualTo("3대에 일반리셋 명령을 전송했습니다.");
        assertThat(ApiMessages.fill("인자 없음 {0}")).isEqualTo("인자 없음 {0}");
        assertThat(ApiMessages.fill("{0} / {x} / {5}", "a")).isEqualTo("a / {x} / {5}");
        // 숫자에 쉼표를 넣지 않는다(MessageFormat 과 다름)
        assertThat(ApiMessages.fill("민원번호 {0}", 12345)).isEqualTo("민원번호 12345");
    }

    @Test
    void seedIsLoadedFromClasspath() {
        assertThat(ApiMessages.size()).isGreaterThan(30);
        assertThat(ApiMessages.text("NTC_001")).isEqualTo("공지사항을 찾을 수 없습니다.");
        assertThat(ApiMessages.text("S005", 3)).isEqualTo("3건 삭제되었습니다.");
        assertThat(ApiMessages.text("MCN_001", "000080", "001")).isEqualTo("기기정보를 찾을 수 없습니다. (000080-001)");
    }

    @Test
    void unknownCodeFallsBackWithCode() {
        assertThat(ApiMessages.text("NO_SUCH_CODE")).contains("NO_SUCH_CODE");
        assertThat(ApiMessages.contains("NO_SUCH_CODE")).isFalse();
    }

    @Test
    void dbRowsOverrideSeed() {
        try {
            ApiMessages.replace(Map.of("NTC_001", "공지가 없습니다(DB)."));
            assertThat(ApiMessages.text("NTC_001")).isEqualTo("공지가 없습니다(DB).");
            assertThat(ApiMessages.text("MNU_001")).isEqualTo("하위 메뉴가 존재하여 삭제할 수 없습니다.");
        } finally {
            ApiMessages.replace(Map.of());
        }
        assertThat(ApiMessages.text("NTC_001")).isEqualTo("공지사항을 찾을 수 없습니다.");
    }

    @Test
    void responsesCarryTableText() {
        ApiResponse<Object> ok = ApiResponse.ok("data");
        assertThat(ok.getCode()).isEqualTo("0000");
        assertThat(ok.getMessage()).isNull();

        ApiResponse<Object> saved = ApiResponse.ok(null, "S001");
        assertThat(saved.getCode()).isEqualTo("0000");
        assertThat(saved.getMessage()).isEqualTo("저장되었습니다.");

        ApiResponse<Object> fail = ApiResponse.fail(new BusinessException("LKP_002", "abc"));
        assertThat(fail.getCode()).isEqualTo("LKP_002");
        assertThat(fail.getMessage()).isEqualTo("조회할 수 없는 항목입니다. (abc)");
    }
}
