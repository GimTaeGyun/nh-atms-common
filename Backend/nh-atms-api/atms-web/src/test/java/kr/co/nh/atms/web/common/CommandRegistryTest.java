package kr.co.nh.atms.web.common;

import kr.co.nh.atms.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

class CommandRegistryTest {

    @Test
    void issueThenUpdate() {
        CommandRegistry reg = new CommandRegistry();
        String id = reg.issue("CASH");
        assertThat(id).startsWith("CASH-");
        assertThat(reg.<Object>get(id).getState()).isEqualTo(CommandStatusDto.PENDING);
        reg.update(id, CommandStatusDto.done(3, "ok"));
        assertThat(reg.<Integer>get(id).getResult()).isEqualTo(3);
        assertThat(reg.<Object>get("nope").getState()).isEqualTo(CommandStatusDto.TIMEOUT);
    }

    @Test
    void runAsync() {
        CommandRegistry reg = new CommandRegistry();
        String ok = reg.run("IT", () -> 42, "S001");
        String bad = reg.run("IT", () -> { throw new IllegalStateException("boom"); }, "S001");
        String biz = reg.run("IT", () -> { throw new BusinessException("NTC_001"); }, "S001");
        await().atMost(Duration.ofSeconds(5)).untilAsserted(() -> {
            assertThat(reg.<Integer>get(ok).getState()).isEqualTo(CommandStatusDto.DONE);
            assertThat(reg.<Integer>get(ok).getResult()).isEqualTo(42);
            assertThat(reg.<Object>get(bad).getState()).isEqualTo(CommandStatusDto.FAIL);
            assertThat(reg.<Integer>get(ok).getMessage()).isEqualTo("저장되었습니다.");
            // 내부 오류 내용(boom)은 화면에 보내지 않고 SYS_500 문구, 업무 예외는 그 코드 문구
            assertThat(reg.<Object>get(bad).getMessage()).isEqualTo("시스템 오류가 발생했습니다.");
            assertThat(reg.<Object>get(biz).getMessage()).isEqualTo("공지사항을 찾을 수 없습니다.");
        });
    }
}
