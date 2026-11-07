# 화면 프론트 지시문 — 목(MSW) 먼저, 백엔드 없이

> 화면 모양부터 만들어 사용자에게 보여 주고, 그 **목 응답을 계약 초안**으로 백엔드에 넘길 때 쓴다.
> 비유: 목 = 백엔드 대신 대답하는 **가짜 창구**. 가짜 창구가 주고받는 서류 양식이 곧 진짜 창구(백엔드)가 지켜야 할 양식이 된다(`docs/00_설계.md` §6.5 "목 응답 = 응답 모양의 계약서").
> 이 파일은 고치지 않고 넘긴다. 바뀌는 것은 "0. 입력" 뿐(`agent-briefs/README.md` §3).
> 경로 줄임말: **FE** = `Frontend/nh-atms-web/src/`.

## 0. 입력 (리드가 채움)

- `agent-briefs/screen-fullstack.md` §0 표와 같다(화면키·제목·slug·업무 이름·API 경로·화면 모양·화면 명세·AS-IS 캡처·TO-BE 테이블·메뉴·응답코드 접두어·질문 번호 범위). 백엔드 패키지 칸은 비어 있어도 된다.
- 추가 칸 **계약 상태**
  - `없음` → 이 에이전트가 계약 초안을 만든다(§3).
  - `docs/07_API_계약.md §N` → 그 절을 글자 그대로 따른다. 바꿔야 하면 바꾸지 말고 보고서 "계약 변경 요청"에 적는다.

## 1. 목표

- 화면 1개를 목 모드(`npm run dev:mock`)에서 **다 동작**하게 만든다: 조회조건·결과 표·버튼·탭·팝업·엑셀·인쇄·권한 흐림·입력 검사.
- 목 핸들러가 백엔드가 할 검사·응답코드·문구를 **같은 순서로** 흉내 낸다 → 백엔드 에이전트가 그대로 옮기면 되게.
- 계약 초안(또는 주어진 계약)과 `domain/<<AREA>>.ts`·목 데이터가 글자 하나까지 같다.
- 백엔드·SQL 파일은 만들지 않는다.

## 2. 먼저 읽을 것

1. `agent-briefs/screen-fullstack.md` 전체 — 특히 §2(읽을 순서), **§3(견본 3종 파일 표)**, §4.1(공통), §4.2(프론트), §4.3(목), §5(소유·금지), §6(품질). 이 지시문은 그 규칙을 **그대로** 따르고 아래 다른 점만 더한다.
2. 고른 견본의 **프론트 파일 전부**:
   - 팝업형 = 공지사항: `FE screens/sample/NoticePage.tsx`, `NoticeParts.tsx`, `FE screens/popup/NoticeEditModal.tsx`, `NoticeViewModal.tsx`, `FE domain/notice.ts`, `FE api/endpoints/notice.ts`, `FE mocks/data/notice.ts`, `FE mocks/handlers/notice.ts`, `FE screens/__tests__/notice.test.tsx`
   - 탭형 = 기기정보: `FE screens/sample/McnInfoPage.tsx`, `McnInfoParts.tsx`, `McnInfoColumns.tsx`, `FE domain/mcnInfo.ts`, `FE api/endpoints/mcnInfo.ts`, `FE mocks/data/mcnInfo.ts`, `FE mocks/handlers/mcnInfo.ts`, `FE screens/__tests__/mcnInfo.test.tsx`
   - 표 일괄 저장형 = 기기모델코드: `FE screens/sample/McnModelPage.tsx`, `McnModelParts.tsx`, `McnModelColumns.tsx`, `FE domain/mcnModel.ts`, `FE api/endpoints/mcnModel.ts`, `FE mocks/data/mcnModel.ts`, `FE mocks/handlers/mcnModel.ts`, `FE screens/__tests__/mcnModel.test.tsx`
3. 부품 카탈로그: `FE screens/sample/CommonModulesPage.tsx` + `FE screens/sample/commonModules/*Tab.tsx`, `docs/05_공통모듈_목록.md`.
4. 응답 모양 쓰는 법: `docs/07_API_계약.md` §0(공통 봉투·`PageResult`·`BatchChanges`·`Audit`), §3~§5(견본 절).
5. 응답코드·문구 목록: `Backend/nh-atms-api/atms-common/src/main/resources/api-message/api-messages.tsv`(읽기만).

## 3. 계약 초안 만드는 법 (계약 상태 = `없음` 일 때)

- 필드는 **TO-BE 정본 컬럼의 camelCase** 만(`INST_PST_CODE` → `instPstCode`). 정본 행은 입력의 CSV 에서 본다.
  - 조인해서 붙이는 이름 필드는 정본의 이름 컬럼 그대로(예 사무소명 `kanm` = `TB_OFC_REG_MGT.KANM`). 정본에 이름 컬럼이 없으면 만들지 말고 질문 후보로.
  - 감사 컬럼이 있는 테이블이면 응답 타입은 `extends Audit`(`FE types/api.ts`).
  - 날짜는 문자열 `YYYYMMDD`·`YYYYMMDDHH24MISS`. null 될 수 있는 칸은 `| null`(정본 `NULL` 칸 기준).
- 경로: 목록 `GET <<API>>`, 1건 `GET <<API>>/{키…}`, 등록 `POST <<API>>`, 수정 `PUT <<API>>/{키…}`, 삭제 `DELETE <<API>>/{키…}` 또는 다건 `POST <<API>>/delete`, 일괄 저장 `POST <<API>>/batch`(견본 3종과 같은 모양).
- 권한 칸: 조회 QRY, 등록 REG, 수정 UPD, 삭제 DEL, 실행 EXE(`docs/07_API_계약.md` §0).
- 문구: 있는 코드 먼저(`S001~S005`, `VAL_001~004`, `V001_20`, `E404`, `SYS_403`). 새 오류는 `<<접두어>>001`… 로 정하고 문구를 지어 TSV 줄로 보고한다.
- 정한 계약은 `FE domain/<<AREA>>.ts` 에 타입으로, 보고서에 `docs/07_API_계약.md` 절(표 + `ts` 블록)로 적는다.

## 4. 이 지시문만의 규칙

- 소유 파일은 `screen-fullstack.md` §5 의 **프론트 줄만**: `FE screens/<<SLUG>>/{Name}Page.tsx`·`{Name}Parts.tsx`·`{Name}Columns.tsx`, `FE screens/popup/{Name}Modal.tsx`, `FE domain/<<AREA>>.ts`, `FE api/endpoints/<<AREA>>.ts`, `FE mocks/data/<<AREA>>.ts`, `FE mocks/handlers/<<AREA>>.ts`, `FE screens/__tests__/<<AREA>>.test.tsx`.
- 백엔드(`Backend/**`)·`db/**`·`docs/**`·공유 프론트 파일은 고치지 않는다(`screen-fullstack.md` §5 금지 목록).
- 목 핸들러 머리 주석에 "백엔드가 할 검사 순서"를 적는다(예 `FE mocks/handlers/notice.ts` `checkSave` 주석 "서버 NoticeService.toNotice 와 같은 순서").
- 목 문구는 TSV 문구와 **같은 글자**. 새 코드면 보고서에 적은 TSV 문구와 같은 글자.
- 목 권한: 목 메뉴는 5개 플래그 모두 Y 로 내려온다(`FE screens/menuSeed.ts` `perms: 'all'`). 권한 없는 모습은 공통 모듈 화면의 "권한 미리보기" 또는 테스트에서 `usePermPreviewStore.getState().setPreview(…)` 로 확인한다(`FE screens/__tests__/notice.test.tsx`).

## 5. 품질 기준

- `screen-fullstack.md` §6 의 프론트·목 항목 전부.
- 목 모드에서: 조회 → 행 보임, 등록·수정·삭제 → 서버 문구 자동 표시 → 목록 다시 읽음, 오류(필수 빠짐·중복·없음) → 서버 문구 표시.
- 렌더 테스트 1개 이상(조회 1건 + 쓰기 1건 + 오류 1건 권장).

## 6. 스스로 검사

```bash
cd /home/user/nh-atms-common/Frontend/nh-atms-web
```

```bash
npm run typecheck
```

```bash
npm run lint
```

```bash
npx vitest run src/screens/__tests__/<<AREA>>.test.tsx
```

- registry 에 줄이 없어 화면이 열리지 않는 것은 정상. 렌더 테스트로 확인한다.

## 7. 보고 형식 (최종 답변, 한국어, 이 순서)

1. **만든 파일** 목록(절대 경로).
2. **계약 초안**(또는 따른 계약 절) — `docs/07_API_계약.md` 에 그대로 넣을 수 있는 markdown(표 + `ts` 블록 + 정렬·키 규칙).
3. **백엔드에 넘길 것** — 목이 흉내 낸 검사 순서·응답코드·HTTP 상태·정렬·기본값(백엔드 에이전트가 이것만 보고 만들 수 있게).
4. **붙여 넣을 줄** — `screen-fullstack.md` §8 의 (a) screenIds, (b) registry, (c) 메뉴·권한 시드 SQL 줄, (d) 목 핸들러 연결, (e) queryKeys·api/index, (f) TSV 줄, (g) e2e 줄. 글자 그대로.
5. **질문 후보** — `docs/90_현업질문_후보.md` 형식 `| Q-xx | 질문 | 관련 | 임시 처리 |`.
6. **계약 변경 요청**(주어진 계약을 따를 수 없던 곳과 이유), **리드 요청**(모자란 공통 부품·`VMSG`/`CMSG` 문구와 임시 우회).
7. **검사 결과**(명령·결과 한 줄씩), **열린 질문**.
