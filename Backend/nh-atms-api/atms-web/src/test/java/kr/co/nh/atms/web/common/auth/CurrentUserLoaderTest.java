package kr.co.nh.atms.web.common.auth;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** 고정 사용자 — TB_SCR_AUTH 채택 규칙(잠정)·관리자 판정·캐시 */
class CurrentUserLoaderTest {

    private static final String NOW = "20261107120000";

    @Test
    void pickAuthTakesApprovedUnexpiredSmallestAuth() {
        List<ScrAuthRow> rows = List.of(
                new ScrAuthRow("000001", "000080", "T", "Y", "99991231235959"),
                new ScrAuthRow("000001", "000081", "A", "D", null),          // 승인 아님
                new ScrAuthRow("000001", "000082", "A", "Y", "20261101000000"), // 만료
                new ScrAuthRow("000001", "000083", "L", "Y ", " "),           // 만료일 빈 값 = 무기한
                new ScrAuthRow("000001", "000084", "P", "Y", null));
        ScrAuthRow r = CurrentUserLoader.pickAuth(rows, NOW);
        assertThat(r.getAuth()).isEqualTo("L");
        assertThat(r.getOfcCode()).isEqualTo("000083");
    }

    @Test
    void pickAuthReturnsNullWhenNothingValid() {
        assertThat(CurrentUserLoader.pickAuth(List.of(), NOW)).isNull();
        assertThat(CurrentUserLoader.pickAuth(null, NOW)).isNull();
        assertThat(CurrentUserLoader.pickAuth(List.of(new ScrAuthRow("1", "2", "A", "N", null)), NOW)).isNull();
    }

    @Test
    void adminIsAuthA() {
        assertThat(CurrentUserLoader.adminYnOf("A")).isEqualTo("Y");
        assertThat(CurrentUserLoader.adminYnOf("A ")).isEqualTo("Y");
        assertThat(CurrentUserLoader.adminYnOf("T")).isEqualTo("N");
        assertThat(CurrentUserLoader.adminYnOf(null)).isEqualTo("N");
    }

    @Test
    void loadBuildsUserAndCaches() {
        CurrentUserMapper mapper = mock(CurrentUserMapper.class);
        InsaRow insa = new InsaRow();
        insa.setPerNo("123456789");
        insa.setName("홍길동");
        insa.setSamuso("000080");
        insa.setSamusoName("본점");
        when(mapper.selectInsa("123456789")).thenReturn(insa);
        when(mapper.selectAuths("123456789")).thenReturn(List.of(new ScrAuthRow("000010", "000080", "A", "Y", null)));
        when(mapper.selectKanm("000080")).thenReturn("본점영업부");
        CurrentUserLoader loader = new CurrentUserLoader(mapper);

        LoginUser u = loader.load(" 123456789 ");
        assertThat(u.perNo()).isEqualTo("123456789");
        assertThat(u.ofcCode()).isEqualTo("000080");
        assertThat(u.deptCode()).isEqualTo("000010");
        assertThat(u.kanm()).isEqualTo("본점영업부");
        assertThat(u.adminYn()).isEqualTo("Y");
        assertThat(Me.of(u).adminYn()).isEqualTo("Y");

        loader.load("123456789");
        verify(mapper, times(1)).selectInsa(anyString());
    }

    @Test
    void unknownPersonIsNull() {
        CurrentUserMapper mapper = mock(CurrentUserMapper.class);
        assertThat(new CurrentUserLoader(mapper).load("999")).isNull();
        assertThat(new CurrentUserLoader(mapper).load(" ")).isNull();
    }

    @Test
    void fixedUserSettingCheck() {
        assertThat(FixedUserFilter.isConfigured("CHANGE_ME")).isFalse();
        assertThat(FixedUserFilter.isConfigured("")).isFalse();
        assertThat(FixedUserFilter.isConfigured(null)).isFalse();
        assertThat(FixedUserFilter.isConfigured("123456789")).isTrue();
    }
}
