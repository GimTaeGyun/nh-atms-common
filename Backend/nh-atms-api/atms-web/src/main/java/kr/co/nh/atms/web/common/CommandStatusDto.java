package kr.co.nh.atms.web.common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 비동기 명령 상태 — 프론트 `hooks/useCommandPoll.ts` 의 CommandStatus `{state, message?, result?}`.
 * state: PENDING | RUNNING | DONE | FAIL | TIMEOUT. 화면은 2초마다 최대 60초 폴링한다.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommandStatusDto<R> {
    public static final String PENDING = "PENDING";
    public static final String RUNNING = "RUNNING";
    public static final String DONE = "DONE";
    public static final String FAIL = "FAIL";
    public static final String TIMEOUT = "TIMEOUT";

    private String state;
    private String message;
    private R result;

    public static <R> CommandStatusDto<R> pending() { return new CommandStatusDto<>(PENDING, null, null); }
    public static <R> CommandStatusDto<R> running() { return new CommandStatusDto<>(RUNNING, null, null); }
    public static <R> CommandStatusDto<R> done(R result, String message) { return new CommandStatusDto<>(DONE, message, result); }
    public static <R> CommandStatusDto<R> fail(String message) { return new CommandStatusDto<>(FAIL, message, null); }
    public static <R> CommandStatusDto<R> timeout(String message) { return new CommandStatusDto<>(TIMEOUT, message, null); }
}
