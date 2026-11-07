package kr.co.nh.atms.web.common.auth;

import kr.co.nh.atms.web.common.Dates;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 개인번호 → {@link LoginUser}. 이름·사무소는 TB_INSA, 권한은 TB_SCR_AUTH(채택 1행), 사무소명은 TB_OFC_REG_MGT.KANM.
 * 결과는 {@value #TTL_MS}ms 동안 메모리에 둔다(요청마다 DB 3번 조회를 피함). TB_INSA 에 없으면 null.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CurrentUserLoader {

    static final long TTL_MS = 60_000L;

    private final CurrentUserMapper mapper;
    private final Map<String, Cached> cache = new ConcurrentHashMap<>();

    private record Cached(LoginUser user, long expiresAt) {}

    /** 개인번호로 사용자 조회(캐시). 인사정보에 없으면 null */
    public LoginUser load(String perNo) {
        if (perNo == null || perNo.isBlank()) return null;
        String key = perNo.trim();
        long now = System.currentTimeMillis();
        Cached c = cache.get(key);
        if (c != null && c.expiresAt() > now) return c.user();
        LoginUser u = loadFromDb(key);
        if (u != null) cache.put(key, new Cached(u, now + TTL_MS));
        else cache.remove(key);
        return u;
    }

    /** 캐시 비우기(권한을 바꾼 뒤 바로 반영하고 싶을 때) */
    public void evictAll() {
        cache.clear();
    }

    LoginUser loadFromDb(String perNo) {
        InsaRow insa = mapper.selectInsa(perNo);
        if (insa == null) {
            log.warn("[고정사용자] TB_INSA 에 개인번호가 없습니다: {}", perNo);
            return null;
        }
        ScrAuthRow a = pickAuth(mapper.selectAuths(perNo), Dates.now14());
        String ofcCode = a == null ? null : trimToNull(a.getOfcCode());
        String kanm = ofcCode == null ? null : mapper.selectKanm(ofcCode);
        String auth = a == null ? null : trimToNull(a.getAuth());
        return new LoginUser(
                trimToNull(insa.getPerNo()), insa.getName(), trimToNull(insa.getSamuso()), insa.getSamusoName(),
                a == null ? null : trimToNull(a.getDeptCode()), ofcCode, kanm, auth, adminYnOf(auth));
    }

    /**
     * TB_SCR_AUTH 행 중 하나를 채택한다.
     * <p>
     * <b>잠정 (API 계약 §1)</b>: {@code APV_STS='Y'} 이고 {@code DUE_DATE} 가 비었거나 지금(14자리) 이후인 행 중
     * {@code AUTH} 오름차순 첫 행. 한 사람이 여러 부서·사무소 권한을 가질 때의 규칙은 현업 확인 전이다.
     */
    public static ScrAuthRow pickAuth(List<ScrAuthRow> rows, String now14) {
        if (rows == null) return null;
        return rows.stream()
                .filter(Objects::nonNull)
                .filter(r -> "Y".equals(trimToNull(r.getApvSts())))
                .filter(r -> {
                    String due = trimToNull(r.getDueDate());
                    return due == null || due.compareTo(now14) > 0;
                })
                .filter(r -> trimToNull(r.getAuth()) != null)
                .min(Comparator.comparing((ScrAuthRow r) -> r.getAuth().trim())
                        .thenComparing(r -> Objects.toString(trimToNull(r.getDeptCode()), ""))
                        .thenComparing(r -> Objects.toString(trimToNull(r.getOfcCode()), "")))
                .orElse(null);
    }

    /**
     * 관리자 여부.
     * <p>
     * <b>잠정 (설계 §5.5, 23 메모 §4.2)</b>: AS-IS 실데이터에서 {@code AUTH='A'} = Admin. 현업 확인 전이다.
     */
    public static String adminYnOf(String auth) {
        return auth != null && "A".equals(auth.trim()) ? "Y" : "N";
    }

    private static String trimToNull(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }
}
