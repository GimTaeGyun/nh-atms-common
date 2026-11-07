# 06. 응답코드 — 체계와 추가하는 법

> 원본 규칙: nh-atms `Document/3.구현계획/25_응답코드_메시지_관리.md`.
> 정본 파일: `Backend/nh-atms-api/atms-common/src/main/resources/api-message/api-messages.tsv`. 계약 표: `docs/07_API_계약.md` §6.
> 프론트에서 보면: **화면에 뜨는 성공·오류 문구는 모두 이 파일에서 온다.** 화면은 서버가 준 `message` 를 그대로 띄운다.

## 1. 응답 모양

```ts
ApiResponse<T> { success: boolean; message: string | null; code: string; data: T }
```

- 성공: `success: true`, `code: '0000'`.
  - 조회는 `message: null`(아무것도 안 띄움).
  - 쓰기는 `message` 에 문구(예 `S002` → "등록되었습니다.") → 프론트 `api/http.ts` 가 자동으로 띄움.
- 실패: `success: false`, `code` 에 오류 코드, `message` 에 문구 → react-query 전역 처리가 띄움.
- 비유: 코드 = **문구 사전의 쪽 번호**. 자바·프론트는 쪽 번호만 말하고, 글은 사전(TSV)에서 꺼낸다.

## 2. 코드 체계

| 묶음 | 뜻 | HTTP | 예 |
|---|---|---|---|
| `0000` | 성공 code | 200 | 모든 성공 응답 |
| `S0xx` | 성공 문구 | 200 | `S001` 저장 · `S002` 등록 · `S003` 수정 · `S004` 삭제 · `S005` {0}건 삭제 |
| `SYS_xxx` | 시스템·보안 | 같은 번호 | `SYS_401` 사용자 확인 필요 · `SYS_403` 권한 없음 · `SYS_404` 주소 없음 · `SYS_405` 메서드 · `SYS_500` 시스템 오류 · `SYS_502` 연계 무응답 |
| `VAL_00x` | 입력 형식 | 400 | `VAL_001` 값 오류 · `VAL_002` 필수 파라미터 없음 · `VAL_003` 형식 오류 · `VAL_004` 본문 해석 실패 |
| `V001_20`, `E404` | 원본에서 옮긴 개별 코드 | 400 / 404 | 사무소코드 필수 / 개인번호 확인 |
| `ME_001` | 고정 사용자 문제 | 401 | 개인번호 설정 없음·인사정보에 없음 |
| `LKP_xxx` | 공통 조회 | 400 / 404 | `LKP_001` 조건 없음 · `LKP_002` 허용 안 된 항목 · `LKP_404` 사무소 없음 |
| `NTC_001` | 공지사항(원본 코드) | 404 | 공지 없음 |
| `MCN_xxx` | 기기정보 견본 | 404 / 400 | `MCN_001` 없음 · `MCN_002` 이미 있음 |
| `MDL_xxx` | 기기모델코드 견본 | 404 / 400 | `MDL_001` 없음 · `MDL_002` 중복 |

- 업무 코드는 `<업무 약어 3자>_<번호 3자리>` 모양으로 새로 짓는다(`MCN_`·`MDL_`·`LKP_` 선례). 같은 약어가 이미 있으면 번호만 늘린다.
- HTTP 상태는 코드가 아니라 **던진 예외**로 정해진다(`docs/03_백엔드_개발가이드.md` §3 표): `BusinessException` 400, `NotFoundException` 404, `ForbiddenException` 403, `UnauthorizedException` 401.
- `SYS_401` 은 코드만 원본이고 문구는 "사용자 확인이 필요합니다." 로 바꿨다(로그인 화면이 없어서, TSV 주석).
- 원본에서 그대로 쓰는 코드와 새로 정한 코드의 목록: TSV 머리 주석, 계약 §6.

## 3. TSV 형식

```
# 응답코드	구분(S 성공/E 오류)	사용자 문구({0} 자리표시)	쓰는 곳
MCN_001	E	기기정보를 찾을 수 없습니다. ({0}-{1})	기기정보 견본
```

- **탭**으로 4칸: 코드 · `S`/`E` · 문구 · 쓰는 곳. `#` 줄은 주석.
- `{0}`, `{1}` 자리에 값이 들어간다: `new NotFoundException("MCN_001", ofcCode, mcnNo)`, `ApiResponse.ok(r, "S005", r.getCount())`.
- 문구 끝은 마침표. 말투는 기존 줄을 따른다("~합니다." / "~하세요.").

## 4. 새 코드 추가하는 법

1. **있는 코드부터 찾는다** — `S001~S005`, `VAL_*`, `SYS_*` 로 되면 새로 만들지 않는다.
2. **TSV 에 한 줄** — `api-messages.tsv` 끝에 탭 4칸으로(리드 파일 — 화면 담당은 넣을 줄을 리드에게 넘김).
3. **계약 문서** — `docs/07_API_계약.md` 해당 절의 "문구" 칸과 §6 표에 같은 코드·문구.
4. **자바는 코드로만** — `throw new BusinessException("XXX_001", 값)`, `ApiResponse.ok(data, "S002")`. 한국어 문구 직접 금지.
5. **목도 같은 글자** — `mocks/handlers/<업무>.ts` 에서 쓰기 성공은 `ok(data, '<TSV 와 같은 문구>')`, 오류는 `fail(상태, '<같은 문구>', '<코드>')`.
6. **프론트가 미리 막는 경우**(보내기 전 검사)에 같은 뜻의 문구가 필요하면 `config/messages.ts` `VMSG` 에 서버 문구와 **같은 글**로 둔다(예 `VMSG.duplicateModel` ↔ `MDL_002`).
7. **검사**:

```bash
cd Backend/nh-atms-api
```

```bash
sh gradlew test --offline --no-daemon
```

- `ApiMessageCodeGuardTest` 가 "쓴 코드가 TSV 에 다 있나", "호출 안에 한글 문구가 없나"를 본다. `ApiMessagesTest` 가 TSV 형식을 본다(`atms-web/src/test/java/kr/co/nh/atms/common/message/`).

## 5. DB 문구 테이블 `T_API_MESSAGE`

- 있으면 백엔드가 기동 때와 5분마다(`atms.api-message.reload-minutes`) 읽어 TSV 문구를 **덮어쓴다** — 재기동 없이 문구 수정(`atms-common/.../message/ApiMessageLoader.java`).
- 없으면 경고만 남기고 TSV 그대로.
- TO-BE 정본에 대응 테이블이 없다(H-074) → 이 저장소는 만들지 않는다.
- 참고: `ApiMessageCodeGuardTest` 주석에 "gen_api_message_seed.py 로 SQL 재생성" 이 남아 있지만, 그 도구는 nh-atms 에만 있고 **이 저장소에는 없다**.

## 6. 프론트가 직접 쓰는 문구 (서버가 말할 수 없는 것만)

| 무엇 | 어디 |
|---|---|
| 통신 끊김·시간 초과·권한 없음 등 HTTP 종류별 기본 문구(서버 문구가 없을 때) | `api/errors.ts` `KIND_MESSAGE` |
| 입력 검증(보내기 전) | `config/messages.ts` `VMSG` |
| 확인창("~하시겠습니까?") | `config/messages.ts` `CMSG` |
| 권한 없음 버튼 툴팁 | `components/auth/useAllowed.ts` `DENIED_TEXT` |
