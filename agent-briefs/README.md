# agent-briefs — 화면 에이전트 지시문 쓰는 법

> 독자: **리드**(사람 또는 리드 Claude 세션). 화면 여러 개를 하위 에이전트에게 나눠 맡길 때 쓴다.
> 비유: 지시문 = **작업 지시서 양식**. 양식(이 폴더 파일)은 그대로 두고, 맨 위 "입력" 칸만 채워서 넘긴다.
> 근거: nh-atms `Frontend/nh-atms-web/docs/offline/07-screen-agent-brief.md`(화면)·`09-backend-agent-brief.md`(백엔드)를 이 저장소 기준(TO-BE `TB_`, 화면키, 권한 5개, 감사 자동 채움)으로 고쳐 합쳤다(`docs/00_설계.md` §9).

## 1. 어떤 지시문을 고르나

| 파일 | 맡기는 일 | 언제 |
|---|---|---|
| `screen-fullstack.md` | 화면 1개 = 프론트 + 목 + 백엔드 + SQL 끝까지 | 기본. 한 화면을 한 에이전트가 맡을 때 |
| `screen-frontend.md` | 프론트 + 목만(계약 초안 포함) | 백엔드를 아직 못 정했거나, 화면 모양부터 사용자에게 보여 줄 때 |
| `screen-backend.md` | 백엔드 + SQL 만 | 계약(`docs/07_API_계약.md` 절 또는 프론트 `domain`·목)이 이미 정해졌을 때 |
| `db-table.md` | TO-BE 테이블 확인 + 질문 후보 작성 | 화면 시작 전에 "이 화면이 쓸 TB_ 테이블이 정본에 있나"부터 볼 때 |

- 순서 추천: `db-table.md` → (`screen-fullstack.md`) 또는 (`screen-frontend.md` → 계약 확정 → `screen-backend.md`).

## 2. 넘기기 전에 리드가 할 일

1. **화면키를 정한다** — `{slug}.{camelCase}`(예 `mgmt.cornerInfo`). 번호는 쓰지 않는다(`src/screens/screenIds.ts` 머리 주석).
2. **대분류(slug)가 새것이면** 먼저 넣는다: `src/types/screen.ts` `L1Slug`, `src/screens/l1.ts` `L1_DEFS`, 메뉴 그룹. 에이전트는 이 파일들을 고치지 않는다.
3. **번호를 나눠 준다**(에이전트끼리 겹치지 않게)
   - 메뉴 ID·상위 메뉴 ID·순서(`TB_SCR_MENU.MENU_ID`, 견본은 `SMP000`~`SMP004`, `db/seed/README.md`)
   - 응답코드 접두어(예 `CNR_` → `CNR_001`…). 이미 쓰인 것: `ME_`, `LKP_`, `MCN_`, `MDL_`, `NTC_`(`api-messages.tsv`)
   - 질문 후보 번호 범위(예 `Q-17`~`Q-19`). `docs/90_현업질문_후보.md` 의 마지막 번호 다음부터
4. **입력 자료 경로를 모은다**
   - 화면 명세(AS-IS 기능 설명·명세 JSON·`docs/` 의 화면 절 등) — 저장소 밖 파일이면 스크래치 폴더에 복사해 경로를 준다
   - AS-IS 캡처 이미지 경로(nh-atms `Document/Asis_화면캡쳐/` 등). IP·계정·인명은 옮기지 않는다
   - TO-BE 테이블 이름과 정본 행. `db/ddl/_source_columns.csv` 는 **15개 테이블만** 들어 있다 → 그 밖의 테이블은 정본 전체(nh-atms `Document/2.개발문서/20_TOBE컬럼정의서.csv`)에서 행을 뽑아 경로를 준다
5. **지시문 파일 + 입력 표**를 에이전트 프롬프트로 넘긴다(아래 3절).

## 3. 넘기는 모양 (프롬프트 틀)

```text
저장소 /home/user/nh-atms-common, 브랜치 <작업 브랜치> 에서 일한다. 사용자에게 묻지 않는다. git commit·push 하지 않는다.
nh-atms, nh-atms-server 는 읽기만 한다.
아래 지시문을 따른다: agent-briefs/screen-fullstack.md (파일을 먼저 끝까지 읽는다)

입력
- 화면키: mgmt.cornerInfo
- 화면 제목: 코너정보
- 대분류 slug: mgmt   (리드가 l1.ts·types/screen.ts 에 이미 넣음)
- 업무 이름(area): cornerInfo   → 프론트 파일 domain/cornerInfo.ts 등
- 백엔드 패키지: cornerinfo     → kr.co.nh.atms.web.cornerinfo
- API 경로: /api/corner-info
- 화면 모양(복사할 견본): 탭형 = 기기정보(sample.mcnInfo)
- 화면 명세: <경로>
- AS-IS 캡처: <경로1>, <경로2>
- TO-BE 테이블: TB_SCRT_INST_PST (정본 행: db/ddl/_source_columns.csv)
- 메뉴: MENU_ID=<…>, 상위=<…>, 순서=<…>
- 응답코드 접두어: CNR_
- 질문 번호 범위: Q-11 ~ Q-13
```

- 여러 에이전트를 동시에 띄울 때 **입력 표만 다르고 지시문은 같다**. 지시문 파일을 고쳐서 넘기지 않는다.
- 하위 에이전트는 CLAUDE.md 의 "5지선다 먼저 묻기" 를 하지 않는다(`CLAUDE.md` 답변 규칙의 예외).

## 4. 받은 보고서로 리드가 할 일 (통합)

1. 보고서의 "붙여 넣을 줄"을 공유 파일에 넣는다.
   - `src/screens/screenIds.ts` 키 한 줄 → `src/screens/registry.ts` `def(...)` 한 줄
   - `src/mocks/handlers/index.ts` import + 펼치기 한 줄, `src/api/queryKeys.ts`·`src/api/index.ts` 한 줄씩
   - `Backend/nh-atms-api/atms-common/src/main/resources/api-message/api-messages.tsv` 줄(탭 구분)
   - 메뉴·권한 시드 줄 → `db/seed/01_menu.sql`·`02_auth_menu.sql`(견본 그룹이면 `src/screens/menuSeed.ts` 도 — `menuSeed.test.ts` 가 둘을 비교) + `db/check/03_seed_status.sql` 행 수
   - `e2e/screens.ts` 한 줄(스크린샷 대상)
   - 질문 후보 → `docs/90_현업질문_후보.md`
   - 계약 절 → `docs/07_API_계약.md`
2. 공통 부품이 모자랐다는 "리드 요청"은 공통 부품을 고친 뒤 화면의 임시 우회를 걷어 낸다(견본 3종 통합 때 한 일: `DbBytes`, `clearOnParentChange`, `EditableGrid` 행별 잠금).
3. 검사(`CLAUDE.md` "커밋 규칙")를 돌리고, 목 모드로 화면을 열어 1280·1920 폭에서 확인한다(`e2e/screenshots.spec.ts`).
4. 커밋·푸시는 리드가 한다.

## 5. 지시문을 고칠 때

- 규칙이 바뀌면(예: 조회 GET 권한 검사 여부) **이 폴더 4개 + `CLAUDE.md` 를 같이** 고친다. 규칙마다 그 규칙이 들어 있는 소스 경로를 적는다.
- 견본 파일 이름이 바뀌면 각 지시문의 "견본 3종" 표를 고친다.
