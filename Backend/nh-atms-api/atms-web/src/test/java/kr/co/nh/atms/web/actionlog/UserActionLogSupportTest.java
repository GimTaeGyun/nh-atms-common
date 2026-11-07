package kr.co.nh.atms.web.actionlog;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.co.nh.atms.web.actionlog.aspect.UserActionLogSupport;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/** 사용자 행위이력 — 수행작업 판정·민감정보 마스킹·바이트 절단 (nh-atms 19_사용자행위이력_설계 §3) */
class UserActionLogSupportTest {

    @Test
    void actionIsDerivedFromMethodUriAndHandlerName() {
        assertThat(UserActionLogSupport.deriveAction("GET", "/api/notice", "list")).isEqualTo("SELECT");
        assertThat(UserActionLogSupport.deriveAction("POST", "/api/notice", "create")).isEqualTo("INSERT");
        assertThat(UserActionLogSupport.deriveAction("PUT", "/api/notice/1", "update")).isEqualTo("UPDATE");
        assertThat(UserActionLogSupport.deriveAction("POST", "/api/notice/delete", "remove")).isEqualTo("DELETE");
        assertThat(UserActionLogSupport.deriveAction("DELETE", "/api/mcn-info/000080/001", "delete")).isEqualTo("DELETE");
        assertThat(UserActionLogSupport.deriveAction("POST", "/api/mcn-model/batch", "saveBatch")).isEqualTo("INSERT");
        assertThat(UserActionLogSupport.deriveAction("GET", "/api/notice/excel", "list")).isEqualTo("EXPORT");
        assertThat(UserActionLogSupport.deriveAction("POST", "/api/notice/x", "downloadReport")).isEqualTo("EXPORT");
        assertThat(UserActionLogSupport.deriveAction("POST", "/api/mcn-info/000080/001/use-yn", "changeUseYn")).isEqualTo("UPDATE");
    }

    @Test
    void secretsAreRemovedAndIdentifiersMasked() {
        assertThat(UserActionLogSupport.maskValue("password", "admin1234!")).isEqualTo("***");
        assertThat(UserActionLogSupport.maskValue("refreshToken", "abc")).isEqualTo("***");
        assertThat(UserActionLogSupport.maskValue("ticket", "T-1")).isEqualTo("***");
        assertThat(UserActionLogSupport.maskValue("accountNo", "3010012345678")).isEqualTo("*********5678");
        assertThat(UserActionLogSupport.maskValue("cardNo", "1234567890123456")).isEqualTo("123456******3456");
        assertThat(UserActionLogSupport.maskValue("cellPhoneNo", "01012345678")).isEqualTo("010****5678");
        assertThat(UserActionLogSupport.maskValue("personNo", "9001011234567")).isEqualTo("900101*******");
        assertThat(UserActionLogSupport.maskValue("ofcCode", "000080")).isEqualTo("000080");
    }

    @Test
    void paramJsonCombinesQueryAndMaskedBody() throws Exception {
        ObjectMapper om = new ObjectMapper();
        Map<String, String[]> query = new LinkedHashMap<>();
        query.put("ofcCode", new String[]{"000080"});
        query.put("regions", new String[]{"A", "B"});
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("perNo", "1234567");
        body.put("password", "secret!");
        body.put("nested", Map.of("cardNo", "1234567890123456"));

        String json = UserActionLogSupport.buildParam(om, query, body);
        var tree = om.readTree(json);
        assertThat(tree.get("query").get("ofcCode").asText()).isEqualTo("000080");
        assertThat(tree.get("query").get("regions")).hasSize(2);
        assertThat(tree.get("body").get("password").asText()).isEqualTo("***");
        assertThat(tree.get("body").get("nested").get("cardNo").asText()).isEqualTo("123456******3456");
        assertThat(json).doesNotContain("secret!");
        assertThat(UserActionLogSupport.buildParam(om, Map.of(), null)).isNull();
    }

    @Test
    void truncateByBytesKeepsWholeCharacters() {
        String s = "가".repeat(2000); // 6000 바이트
        String t = UserActionLogSupport.truncateBytes(s, UserActionLogSupport.PARAM_MAX_BYTES);
        assertThat(t.getBytes(StandardCharsets.UTF_8).length).isLessThanOrEqualTo(UserActionLogSupport.PARAM_MAX_BYTES);
        assertThat(t).endsWith("…").doesNotContain("�");
        assertThat(UserActionLogSupport.truncateBytes("short", 100)).isEqualTo("short");
        assertThat(UserActionLogSupport.truncateBytes(null, 100)).isNull();
    }
}
