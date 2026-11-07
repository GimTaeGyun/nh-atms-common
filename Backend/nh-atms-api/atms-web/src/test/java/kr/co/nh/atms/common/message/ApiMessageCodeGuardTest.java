package kr.co.nh.atms.common.message;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 응답코드 지킴이 — 백엔드 전 모듈 소스에서
 * <ul>
 *   <li>예외 생성({@code new BusinessException("X")} 등)·{@code ApiResponse.ok(data, "S001")}·{@code ApiResponse.fail("X")}·검증 어노테이션 {@code message = "VAL_101"}
 *       에 쓴 응답코드가 시드(api-messages.tsv → T_API_MESSAGE)에 모두 있는지</li>
 *   <li>그 호출 안에 한글 문구를 직접 쓰지 않았는지(문구는 테이블에서만)</li>
 * </ul>
 * 를 검사한다. 새 응답코드는 api-messages.tsv 에 한 줄 추가 → gen_api_message_seed.py 로 SQL 재생성.
 */
class ApiMessageCodeGuardTest {

    private static final Pattern CALL = Pattern.compile(
            "new\\s+(?:BusinessException|NotFoundException|ForbiddenException|UnauthorizedException)\\s*\\(|ApiResponse\\s*\\.\\s*(?:ok|fail)\\s*\\(");
    private static final Pattern ANNOT = Pattern.compile("@\\w+\\s*\\([^)]*?message\\s*=\\s*\"([^\"]*)\"", Pattern.DOTALL);
    private static final Pattern CODE_LIT = Pattern.compile("\"([A-Z][A-Z0-9_]*\\d(?:_\\d+)?|[A-Z]+_[A-Z0-9_]+)\"");
    private static final Pattern KOREAN_LIT = Pattern.compile("\"[^\"\\n]*[가-힣][^\"\\n]*\"");

    @Test
    void everyCodeIsInSeedAndNoInlineKoreanMessage() throws IOException {
        List<String> missing = new ArrayList<>();
        List<String> inline = new ArrayList<>();
        for (Path f : javaSources()) {
            String s = Files.readString(f, StandardCharsets.UTF_8);
            Matcher m = CALL.matcher(s);
            while (m.find()) {
                String before = s.substring(Math.max(0, m.start() - 20), m.start());
                if (before.contains("class ")) continue;
                String args = args(s, m.end() - 1);
                String where = f.getFileName() + ":" + line(s, m.start());
                Matcher k = KOREAN_LIT.matcher(args);
                if (k.find()) inline.add(where + " " + k.group());
                Matcher c = CODE_LIT.matcher(args);
                while (c.find()) {
                    if (!ApiMessages.contains(c.group(1)) && !NOT_CODES.contains(c.group(1))) missing.add(where + " " + c.group(1));
                }
            }
            Matcher a = ANNOT.matcher(s);
            while (a.find()) {
                String v = a.group(1);
                String where = f.getFileName() + ":" + line(s, a.start());
                if (!ApiMessages.contains(v)) missing.add(where + " message=\"" + v + "\"");
            }
        }
        assertThat(missing).as("api-messages.tsv 에 없는 응답코드 — 시드에 추가하세요").isEmpty();
        assertThat(inline).as("응답·예외에 한글 문구 직접 사용 — 응답코드로 바꾸고 문구는 api-messages.tsv 에").isEmpty();
    }

    /** 응답코드가 아닌 대문자 리터럴(인자로 쓰이는 값) */
    private static final java.util.Set<String> NOT_CODES = new TreeSet<>(List.of("ALL", "MODE", "SCOPE", "CYCLE", "STAFF", "MANAGER"));

    private static List<Path> javaSources() throws IOException {
        Path root = Paths.get("").toAbsolutePath();
        Path backend = Files.exists(root.resolve("settings.gradle")) ? root : root.getParent();
        List<Path> out = new ArrayList<>();
        try (Stream<Path> mods = Files.list(backend)) {
            for (Path mod : mods.filter(p -> p.getFileName().toString().startsWith("atms-")).toList()) {
                Path src = mod.resolve("src/main/java");
                if (!Files.isDirectory(src)) continue;
                try (Stream<Path> w = Files.walk(src)) {
                    w.filter(p -> p.toString().endsWith(".java")).forEach(out::add);
                }
            }
        }
        assertThat(out).as("백엔드 소스를 찾지 못함: " + backend).isNotEmpty();
        return out;
    }

    /** 여는 괄호부터 짝 맞는 닫는 괄호까지(문자열 리터럴 안 괄호 무시) */
    private static String args(String s, int open) {
        int depth = 0;
        for (int i = open; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (ch == '"') {
                i++;
                while (i < s.length() && s.charAt(i) != '"') {
                    if (s.charAt(i) == '\\') i++;
                    i++;
                }
                continue;
            }
            if (ch == '(') depth++;
            else if (ch == ')' && --depth == 0) return s.substring(open + 1, i);
        }
        return s.substring(open + 1);
    }

    private static int line(String s, int idx) {
        int n = 1;
        for (int i = 0; i < idx; i++) if (s.charAt(i) == '\n') n++;
        return n;
    }
}
