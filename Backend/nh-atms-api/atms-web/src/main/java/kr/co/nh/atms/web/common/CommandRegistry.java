package kr.co.nh.atms.web.common;

import kr.co.nh.atms.common.exception.BusinessException;
import kr.co.nh.atms.common.message.ApiMessages;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Function;
import java.util.function.Supplier;

/**
 * 서버 측 비동기 작업 저장소 (프론트 POST → {cmdId} → GET …/{cmdId} 폴링 계약).
 * 원본(nh-atms)에서는 시재 조회 요청·전산비용 산정·용역료 재산정·원격지시가 쓴다.
 * 메모리 보관(기본 30분)이라 **JEUS 인스턴스 간 공유되지 않는다** — 다중 인스턴스에서는 세션 고정(sticky)이 필요하다.
 * 기기 실연동이 붙는 작업은 T_AGENT_COMMAND 의 상태를 읽어 {@link #get} 전에 갱신하는 방식으로 확장한다.
 */
@Slf4j
@Component
public class CommandRegistry {

    private static final long TTL_MS = 30 * 60 * 1000L;

    private record Entry(CommandStatusDto<Object> status, long createdAt) {}

    private final Map<String, Entry> store = new ConcurrentHashMap<>();
    private final ExecutorService executor = Executors.newFixedThreadPool(4, r -> {
        Thread t = new Thread(r, "async-command");
        t.setDaemon(true);
        return t;
    });

    /** 새 cmdId 발급(PENDING) */
    public String issue(String prefix) {
        evict();
        String id = prefix + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
        store.put(id, new Entry(CommandStatusDto.pending(), System.currentTimeMillis()));
        return id;
    }

    /** 발급 후 백그라운드에서 작업 실행. 작업 결과가 상태(DONE)의 result 가 되고, 완료 문구는 응답코드 doneCode 의 문구. */
    public <R> String run(String prefix, Supplier<R> work, String doneCode) {
        return run(prefix, work, doneCode, r -> new Object[0]);
    }

    /** 완료 문구에 결과값을 넣을 때(예: "전산비용 계산이 완료되었습니다. ({0}건)") */
    public <R> String run(String prefix, Supplier<R> work, String doneCode, Function<R, Object[]> doneArgs) {
        String id = issue(prefix);
        executor.submit(() -> {
            update(id, CommandStatusDto.running());
            try {
                R r = work.get();
                update(id, CommandStatusDto.done(r, ApiMessages.text(doneCode, doneArgs.apply(r))));
            } catch (Exception e) {
                log.warn("[command] {} 실패: {}", id, e.toString());
                update(id, CommandStatusDto.fail(failMessage(e)));
            }
        });
        return id;
    }

    @SuppressWarnings("unchecked")
    public <R> void update(String cmdId, CommandStatusDto<R> status) {
        Entry old = store.get(cmdId);
        store.put(cmdId, new Entry((CommandStatusDto<Object>) status, old == null ? System.currentTimeMillis() : old.createdAt()));
    }

    /** 없는 cmdId 는 TIMEOUT(만료)로 본다 — 화면이 종료 상태로 처리한다. */
    @SuppressWarnings("unchecked")
    public <R> CommandStatusDto<R> get(String cmdId) {
        Entry e = store.get(cmdId);
        if (e == null) return CommandStatusDto.timeout(ApiMessages.text("CMD_EXPIRED"));
        return (CommandStatusDto<R>) e.status();
    }

    public boolean exists(String cmdId) { return store.containsKey(cmdId); }

    private void evict() {
        long now = System.currentTimeMillis();
        store.entrySet().removeIf(en -> now - en.getValue().createdAt() > TTL_MS);
    }

    /** 테스트용: 등록 시각(Instant) */
    Instant createdAt(String cmdId) {
        Entry e = store.get(cmdId);
        return e == null ? null : Instant.ofEpochMilli(e.createdAt());
    }

    /** 실패 문구 — 업무 예외는 그 응답코드 문구, 그 밖의 오류는 SYS_500(내부 내용은 로그에만) */
    public static String failMessage(Exception e) {
        return e instanceof BusinessException be ? be.getMessage() : ApiMessages.text("SYS_500");
    }
}
