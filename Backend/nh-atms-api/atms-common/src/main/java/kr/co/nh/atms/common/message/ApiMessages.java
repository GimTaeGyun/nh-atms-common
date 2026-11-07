package kr.co.nh.atms.common.message;

import lombok.extern.slf4j.Slf4j;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * API 응답 메시지 사전 — 응답코드(MSG_CD) → 사용자에게 보여줄 문구.
 * <p>
 * 정본은 DB 테이블 {@code T_API_MESSAGE}(Document/2.개발문서/sql/V1.6.24__api_message.sql).
 * 기동 시 클래스패스 {@code api-message/api-messages.tsv}(같은 시드)를 먼저 읽고,
 * {@link ApiMessageLoader} 가 DB 내용을 덮어쓴다 — DB 가 아직 없거나 접속이 안 돼도 문구가 비지 않는다.
 * <p>
 * 문구의 {@code {0}}, {@code {1}} … 자리에 인자를 순서대로 넣는다(MessageFormat 처럼 숫자에 쉼표를 넣지 않는다).
 */
@Slf4j
public final class ApiMessages {

    /** 성공 응답 코드 */
    public static final String SUCCESS = "0000";

    static final String SEED_RESOURCE = "api-message/api-messages.tsv";

    private static volatile Map<String, String> texts = Collections.unmodifiableMap(readSeed());
    private static final Set<String> warned = ConcurrentHashMap.newKeySet();

    private ApiMessages() {
    }

    /** 코드에 해당하는 문구(인자 채움). 사전에 없는 코드면 코드를 붙인 기본 문구를 돌려주고 경고를 한 번 남긴다. */
    public static String text(String code, Object... args) {
        String t = code == null ? null : texts.get(code);
        if (t == null) {
            if (code != null && warned.add(code)) log.warn("[ApiMessages] 등록되지 않은 응답코드: {}", code);
            return "요청을 처리하지 못했습니다. (" + code + ")";
        }
        return fill(t, args);
    }

    /** 사전에 등록된 코드인지 */
    public static boolean contains(String code) {
        return code != null && texts.containsKey(code);
    }

    /** DB 에서 읽은 내용으로 교체(시드 위에 덮어쓴다) */
    static void replace(Map<String, String> fromDb) {
        Map<String, String> m = new HashMap<>(readSeed());
        m.putAll(fromDb);
        texts = Collections.unmodifiableMap(m);
        warned.clear();
    }

    static int size() {
        return texts.size();
    }

    static String fill(String template, Object... args) {
        if (args == null || args.length == 0 || template.indexOf('{') < 0) return template;
        StringBuilder sb = new StringBuilder(template.length() + 16);
        int i = 0;
        while (i < template.length()) {
            char c = template.charAt(i);
            if (c == '{') {
                int close = template.indexOf('}', i);
                if (close > i + 1 && isDigits(template, i + 1, close)) {
                    int n = Integer.parseInt(template.substring(i + 1, close));
                    sb.append(n < args.length ? String.valueOf(args[n]) : template.substring(i, close + 1));
                    i = close + 1;
                    continue;
                }
            }
            sb.append(c);
            i++;
        }
        return sb.toString();
    }

    private static boolean isDigits(String s, int from, int to) {
        for (int i = from; i < to; i++) {
            if (!Character.isDigit(s.charAt(i))) return false;
        }
        return true;
    }

    /** 시드 TSV: 코드 \t 구분(S/E) \t 문구 \t 쓰는 곳 */
    static Map<String, String> readSeed() {
        Map<String, String> m = new HashMap<>();
        try (InputStream in = ApiMessages.class.getClassLoader().getResourceAsStream(SEED_RESOURCE)) {
            if (in == null) {
                log.warn("[ApiMessages] 시드 파일 없음: {}", SEED_RESOURCE);
                return m;
            }
            BufferedReader r = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8));
            String line;
            while ((line = r.readLine()) != null) {
                if (line.isBlank() || line.startsWith("#")) continue;
                String[] c = line.split("\t", -1);
                if (c.length >= 3) m.put(c[0].trim(), c[2]);
            }
        } catch (IOException e) {
            log.warn("[ApiMessages] 시드 읽기 실패: {}", e.getMessage());
        }
        return m;
    }
}
