package kr.co.nh.atms.web.actionlog.aspect;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import kr.co.nh.atms.web.common.Masking;

import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * 행위 이력 판정·마스킹 규칙(순수 함수 — 단위 테스트 대상).
 *
 * <ul>
 *   <li>수행작업: URI·메서드명에 excel/export/download/print 가 있으면 EXPORT, GET 은 SELECT,
 *       DELETE 메서드·이름이 delete/remove 로 시작·URI 가 /delete 로 끝나면 DELETE, PUT/PATCH·이름이 update/modify 로 시작하면 UPDATE, 나머지 POST 는 INSERT.</li>
 *   <li>인자: 비밀번호·토큰·Ticket 류 키는 값 자체를 지우고(***), 계좌·카드·전화·개인번호 류 키는 마스킹한다. 결과는 바이트 단위로 자른다(VARCHAR2(4000)).</li>
 * </ul>
 */
public final class UserActionLogSupport {
    private UserActionLogSupport() {}

    public static final int PARAM_MAX_BYTES = 3900;
    public static final int MSG_MAX_BYTES = 480;

    /** 값 자체를 남기면 안 되는 키 */
    private static final Pattern SECRET_KEY = Pattern.compile("(?i)(password|passwd|pwd|secret|token|ticket|authorization|otp|pin)");
    private static final Pattern ACCOUNT_KEY = Pattern.compile("(?i)(acct|account)");
    private static final Pattern CARD_KEY = Pattern.compile("(?i)card");
    private static final Pattern PHONE_KEY = Pattern.compile("(?i)(phone|tel|mobile|cell)");
    private static final Pattern PERSON_KEY = Pattern.compile("(?i)(rrn|personNo|residentNo|ssn|juminNo)");
    private static final Pattern EXPORT_HINT = Pattern.compile("(?i)(excel|export|download|print|xlsx|report)");

    public static String deriveAction(String httpMethod, String uri, String handlerName) {
        String m = httpMethod == null ? "" : httpMethod.toUpperCase(Locale.ROOT);
        String u = uri == null ? "" : uri;
        String h = handlerName == null ? "" : handlerName;
        if (EXPORT_HINT.matcher(u).find() || EXPORT_HINT.matcher(h).find()) return "EXPORT";
        if ("GET".equals(m)) return "SELECT";
        String hl = h.toLowerCase(Locale.ROOT);
        if ("DELETE".equals(m) || hl.startsWith("delete") || hl.startsWith("remove") || u.endsWith("/delete")) return "DELETE";
        if ("PUT".equals(m) || "PATCH".equals(m) || hl.startsWith("update") || hl.startsWith("modify") || hl.startsWith("change")) return "UPDATE";
        return "INSERT";
    }

    /** 키 이름으로 값 마스킹. 민감 키는 ***, 식별번호 키는 부분 마스킹, 나머지는 그대로 */
    public static String maskValue(String key, String value) {
        if (value == null) return null;
        String k = key == null ? "" : key;
        if (SECRET_KEY.matcher(k).find()) return "***";
        if (CARD_KEY.matcher(k).find()) return Masking.card(value);
        if (ACCOUNT_KEY.matcher(k).find()) return Masking.account(value);
        if (PERSON_KEY.matcher(k).find()) return Masking.personNo(value);
        if (PHONE_KEY.matcher(k).find()) return Masking.phone(value);
        return value;
    }

    /** JSON 트리를 재귀로 돌며 키 이름 기준 마스킹(원본을 바꾼다) */
    public static JsonNode maskTree(JsonNode node) {
        if (node == null) return null;
        if (node.isObject()) {
            ObjectNode o = (ObjectNode) node;
            Iterator<Map.Entry<String, JsonNode>> it = o.fields();
            while (it.hasNext()) {
                Map.Entry<String, JsonNode> e = it.next();
                JsonNode v = e.getValue();
                if (v.isValueNode()) {
                    String masked = maskValue(e.getKey(), v.isNull() ? null : v.asText());
                    if (masked == null) o.putNull(e.getKey()); else o.put(e.getKey(), masked);
                } else {
                    maskTree(v);
                }
            }
        } else if (node.isArray()) {
            for (JsonNode child : (ArrayNode) node) maskTree(child);
        }
        return node;
    }

    /** 쿼리 파라미터 + 본문을 한 JSON 문자열로. {"query":{...},"body":...} */
    public static String buildParam(ObjectMapper om, Map<String, String[]> query, Object body) {
        ObjectNode root = om.createObjectNode();
        if (query != null && !query.isEmpty()) {
            ObjectNode q = root.putObject("query");
            for (Map.Entry<String, String[]> e : query.entrySet()) {
                String[] vs = e.getValue();
                if (vs == null || vs.length == 0) { q.putNull(e.getKey()); continue; }
                if (vs.length == 1) q.put(e.getKey(), maskValue(e.getKey(), vs[0]));
                else { ArrayNode a = q.putArray(e.getKey()); for (String v : vs) a.add(maskValue(e.getKey(), v)); }
            }
        }
        if (body != null) {
            try {
                root.set("body", maskTree(om.valueToTree(body)));
            } catch (Exception e) {
                root.put("body", "[직렬화 불가: " + body.getClass().getSimpleName() + "]");
            }
        }
        if (root.isEmpty()) return null;
        return truncateBytes(root.toString(), PARAM_MAX_BYTES);
    }

    /** UTF-8 바이트 기준 절단(글자 중간에서 자르지 않음). 잘리면 끝에 '…' */
    public static String truncateBytes(String s, int maxBytes) {
        if (s == null) return null;
        byte[] b = s.getBytes(StandardCharsets.UTF_8);
        if (b.length <= maxBytes) return s;
        int end = 0;
        int bytes = 0;
        for (int i = 0; i < s.length(); ) {
            int cp = s.codePointAt(i);
            int len = new String(Character.toChars(cp)).getBytes(StandardCharsets.UTF_8).length;
            if (bytes + len > maxBytes - 3) break;
            bytes += len;
            i += Character.charCount(cp);
            end = i;
        }
        return s.substring(0, end) + "…";
    }
}
