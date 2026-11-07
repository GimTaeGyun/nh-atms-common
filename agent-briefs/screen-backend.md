# 화면 백엔드 지시문 — 계약 먼저, 그대로 구현

> 응답 모양(계약)이 이미 정해진 화면의 백엔드(컨트롤러 → 서비스 → 매퍼 → SQL)만 만들 때 쓴다.
> 비유: 계약 = **주문서**. 주문서에 적힌 필드·코드를 한 글자도 바꾸지 않고 만든다. 주문서가 틀렸다고 생각되면 고치지 말고 보고한다.
> 근거: nh-atms `Frontend/nh-atms-web/docs/offline/09-backend-agent-brief.md` 를 이 저장소 기준으로 고침 — `T_` DDL 새로 만들기·`REG_DT` 감사 컬럼·`ROLE_ADMIN` 검사는 **쓰지 않는다**(TO-BE `TB_` 정본, 감사 자동 채움, 권한 5개 플래그).
> 이 파일은 고치지 않고 넘긴다. 바뀌는 것은 "0. 입력" 뿐(`agent-briefs/README.md` §3).
> 경로 줄임말: **BE** = `Backend/nh-atms-api/atms-web/src/main/java/kr/co/nh/atms/web/`, **XML** = `Backend/nh-atms-api/atms-web/src/main/resources/mapper/`, **BT** = `Backend/nh-atms-api/atms-web/src/test/java/kr/co/nh/atms/web/`, **FE** = `Frontend/nh-atms-web/src/`.

## 0. 입력 (리드가 채움)

- `agent-briefs/screen-fullstack.md` §0 표와 같다(화면키·제목·백엔드 패키지·API 경로·화면 모양·TO-BE 테이블·응답코드 접두어·질문 번호 범위).
- 추가 칸 **계약 위치** — 아래 중 하나 이상
  - `docs/07_API_계약.md §N`
  - 프론트 묶음: `FE domain/<<AREA>>.ts`(필드·타입), `FE api/endpoints/<<AREA>>.ts`(경로·파라미터 이름), `FE mocks/handlers/<<AREA>>.ts`(검사 순서·응답코드·HTTP 상태), `FE mocks/data/<<AREA>>.ts`(값 예시)
  - 프론트 에이전트 보고서의 "백엔드에 넘길 것"
- 계약 위치의 파일은 **읽기만** 한다(프론트 파일 수정 금지).

## 1. 목표

- 계약의 경로·요청·응답 모양·권한·문구 코드를 **그대로** 구현한다.
  - 응답 필드 이름·null 여부·타입이 `FE domain/<<AREA>>.ts` 와 같다.
  - 오류 응답의 HTTP 상태·코드가 목 핸들러와 같다.
- SQL 은 TO-BE 정본 테이블·컬럼만 쓴다. 정본에 없는 것이 계약에 있으면 만들지 말고 보고한다.
- 서비스 Mockito 테스트로 분기·잠정 규칙을 확인한다.

## 2. 먼저 읽을 것

1. `CLAUDE.md` — "정해진 것", "DB — TO-BE 테이블", "백엔드 핵심 규칙".
2. `agent-briefs/screen-fullstack.md` §3(견본 3종 파일 표), **§4.4(백엔드)·§4.5(SQL)**, §5(소유·금지), §6(품질). 이 지시문은 그 규칙을 그대로 따른다.
3. `docs/00_설계.md` §5(백엔드), §7(DB), `docs/03_백엔드_개발가이드.md`, `docs/04_DB_규칙.md`.
4. 고른 견본의 **백엔드 파일 전부**:
   - 팝업형 = 공지사항: `BE notice/controller/NoticeController.java`, `BE notice/service/{NoticeService,NoticeRules}.java`, `BE notice/dto/*.java`, `BE notice/mapper/NoticeMapper.java`, `XML notice/NoticeMapper.xml`, `BT notice/NoticeServiceTest.java`
   - 탭형 = 기기정보: `BE mcninfo/controller/McnInfoController.java`, `BE mcninfo/service/McnInfoService.java`, `BE mcninfo/dto/{McnInfo,McnInfoKey,McnInfoSave,McnInfoSearchDto}.java`, `BE mcninfo/mapper/McnInfoMapper.java`, `XML mcninfo/McnInfoMapper.xml`, `BT mcninfo/McnInfoServiceTest.java`
   - 표 일괄 저장형 = 기기모델코드: `BE mcnmodel/controller/McnModelController.java`, `BE mcnmodel/service/{McnModelService,McnModelRules}.java`, `BE mcnmodel/dto/*.java`, `BE mcnmodel/mapper/McnModelMapper.java`, `XML mcnmodel/McnModelMapper.xml`, `BT mcnmodel/McnModelServiceTest.java`
5. 공통 계층(그대로 가져다 쓴다, 고치지 않음)
   - `Backend/nh-atms-api/atms-common/src/main/java/kr/co/nh/atms/common/`: `response/ApiResponse`, `page/{PageRequest,PageResult}`, `exception/BusinessException`, `audit/{AuditFields,AuditInterceptor}`
   - `BE common/`: `CurrentUser`, `OfficeCode`, `Dates`, `Yn`, `DbBytes`, `BatchChanges`, `NotFoundException`, `ForbiddenException`, `Pages`, `Masking`
   - `BE common/auth/`: `RequireMenuAuth`, `Perm`, `MenuAuthService`(`check`·`has`)
6. 응답코드: `Backend/nh-atms-api/atms-common/src/main/resources/api-message/api-messages.tsv`(읽기만).
7. 입력의 TO-BE 테이블 정본 행(`db/ddl/_source_columns.csv` 또는 리드가 준 경로), 있으면 `db/ddl/<TABLE>.sql`.

## 3. 이 지시문만의 규칙

- 소유 파일은 `screen-fullstack.md` §5 의 **백엔드 줄만**: `BE <<PKG>>/**`, `XML <<PKG>>/*.xml`, `BT <<PKG>>/**`.
- 프론트·`db/**`·`docs/**`·공통(`BE common/**`, `atms-common/**`, `api-messages.tsv`, `application*.yml`, `build.gradle`)은 고치지 않는다.
- 계약과 정본이 다르면(정본에 컬럼이 없음, 타입이 다름, 길이가 모자람) **정본을 따르고 계약은 고치지 않는다** → 보고서 "계약과 다른 점"에 적고 질문 후보를 쓴다.
- 이 저장소에서는 **DDL 을 새로 만들지 않는다**(`db/ddl` 은 정본 CSV 생성물, `db/ddl/README.md`). 새 테이블·컬럼이 필요하면 `agent-briefs/db-table.md` 형식으로 질문 후보만.
- 감사 컬럼: DTO `extends AuditFields`, 매퍼는 `#{crtDtm}`·`#{crtCmeno}`·`#{lschgDtm}`·`#{lsCmeno}` 만 쓴다. 감사 값과 상관없는 갱신(예: 조회수 +1)은 파라미터를 `Auditable` 이 아닌 값으로 넘겨 감사 컬럼을 건드리지 않는다(`XML notice/NoticeMapper.xml` `increaseVisit` 주석).
- 권한: 계약의 "권한" 칸 그대로 `@RequireMenuAuth(screen = SCREEN, need = Perm.X)`. 일괄 저장은 서비스에서 종류별 `menuAuth.check`(`BE mcnmodel/service/McnModelService.java` `saveBatch`).
- 기존 코드를 재사용할 때는 **호출**한다(복사하지 않음). 공통 조회가 필요하면 `BE lookup/service/LookupService.java` 를 부르거나 프론트가 `/api/lookup/*` 를 쓰게 둔다.
- 경로 겹침 확인: 새 경로가 이미 있는지 먼저 찾는다.

```bash
grep -rn "Mapping(\"<<API>>" /home/user/nh-atms-common/Backend/nh-atms-api/atms-web/src/main/java
```

## 4. 품질 기준

- 계약의 엔드포인트 **전부** 구현. 응답 필드가 `FE domain/<<AREA>>.ts` 와 같다(빠진 필드·더한 필드 없음).
- 오류 분기(400 `VAL_*`·업무 코드, 404, 403)가 목 핸들러와 같은 순서·코드.
- 서비스 테스트 1개 이상: 값 정리, 오류 코드 분기, 잠정 규칙, (일괄 저장이면) 처리 순서·권한 종류별 검사.
- SQL: 대문자·정본 이름·`CAST(… AS CHAR(n))`·`${}` 없음·페이징 + 건수 따로. 새 SQL 은 "폐쇄망 개발 DB 확인 필요"로 보고.

## 5. 스스로 검사

```bash
cd /home/user/nh-atms-common/Backend/nh-atms-api
```

```bash
sh gradlew :atms-web:test --tests 'kr.co.nh.atms.web.<<PKG>>.*' --tests 'kr.co.nh.atms.web.common.*' --tests 'kr.co.nh.atms.common.message.*' --no-daemon
```

- `common.*` 에 매퍼 XML 적재(`MapperXmlLoadTest`)·클래스 이름 유일(`TypeAliasUniquenessTest`), `common.message.*` 에 응답코드 지킴이(`ApiMessageCodeGuardTest`)가 있다.
- 새 응답코드가 TSV 에 아직 없어서 지킴이만 실패하면 정상 — 보고서에 그 사실과 TSV 줄을 적는다.
- 폐쇄망이면 `--offline`. Gradle 잠금을 다른 에이전트와 같이 쓰므로 **중간 1번 + 마지막 1번**만.

## 6. 보고 형식 (최종 답변, 한국어, 이 순서)

1. **엔드포인트 표**: `메서드 경로 | 컨트롤러.메서드 | 권한 | 매퍼 id | 테이블 | 문구 코드 | 판정(새 SQL / 기존 호출 / 정본 없어 보류)`.
2. **계약과 다른 점**: 어디가·왜(정본 근거 행)·제안.
3. **붙여 넣을 줄**: `api-messages.tsv` 줄(칸 사이 탭 1개: 코드·S/E·문구·쓰는 곳) — 목 문구와 같은 글자인지 확인 표시.
4. **잠정 규칙**: `클래스.메서드 | 내용 | 질문 번호 | 답이 오면 고칠 곳`.
5. **질문 후보**: `docs/90_현업질문_후보.md` 형식 `| Q-xx | 질문 | 관련 | 임시 처리 |`.
6. **리드 요청**: 공통 클래스·설정·다른 업무 코드 수정이 필요한 것.
7. **만든 파일** 목록(절대 경로), **검사 결과**(명령·결과·테스트 수 한 줄씩), **열린 질문**.
