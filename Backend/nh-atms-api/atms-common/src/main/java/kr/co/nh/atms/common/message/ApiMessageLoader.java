package kr.co.nh.atms.common.message;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import jakarta.annotation.PreDestroy;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * T_API_MESSAGE → {@link ApiMessages} 적재.
 * 기동 직후 1회 + {@code atms.api-message.reload-minutes}(기본 5분)마다 다시 읽는다 — 관리자가 문구를 고치면 재기동 없이 반영.
 * DB·테이블이 없으면 경고만 남기고 클래스패스 시드를 그대로 쓴다.
 */
@Slf4j
@Component
public class ApiMessageLoader {

    static final String SQL = "SELECT MSG_CD, MSG_TEXT FROM T_API_MESSAGE WHERE USE_YN = 'Y'";

    private final ObjectProvider<JdbcTemplate> jdbc;
    private final long reloadMinutes;
    private ScheduledExecutorService timer;

    public ApiMessageLoader(ObjectProvider<JdbcTemplate> jdbc,
                            @Value("${atms.api-message.reload-minutes:5}") long reloadMinutes) {
        this.jdbc = jdbc;
        this.reloadMinutes = reloadMinutes;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        reload();
        if (reloadMinutes > 0) {
            timer = Executors.newSingleThreadScheduledExecutor(r -> {
                Thread t = new Thread(r, "api-message-reload");
                t.setDaemon(true);
                return t;
            });
            timer.scheduleWithFixedDelay(this::reload, reloadMinutes, reloadMinutes, TimeUnit.MINUTES);
        }
    }

    /** DB 에서 다시 읽는다. 실패하면 기존 내용 유지 */
    public void reload() {
        JdbcTemplate t = jdbc.getIfAvailable();
        if (t == null) return;
        try {
            Map<String, String> m = new HashMap<>();
            t.query(SQL, rs -> {
                String code = rs.getString(1);
                String text = rs.getString(2);
                if (code != null && text != null) m.put(code.trim(), text);
            });
            ApiMessages.replace(m);
            log.debug("[ApiMessages] DB 적재 {}건", m.size());
        } catch (RuntimeException e) {
            log.warn("[ApiMessages] T_API_MESSAGE 를 읽지 못해 시드 문구를 씁니다: {}", e.getMessage());
        }
    }

    @PreDestroy
    public void stop() {
        if (timer != null) timer.shutdownNow();
    }
}
