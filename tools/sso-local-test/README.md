# SSO PC 테스트 — 방화벽이 열리면 이것만 하면 된다

> 농협 통합로그인(NexessClient)이 우리 쪽에서 끝까지 되는지, **ATMS 서버·배포 없이 내 PC 하나로** 확인한다.
> 근거: INITECH 「SSO(Nexess Client) 업무서버 연동 가이드」 3.4~3.7절. 이 폴더 파일은 `SsoLocalTest.java` 하나다.

## 언제 하나

- 현업이 "방화벽 열렸다"(내 PC → `19.24.144.187` / `ssodev.nonghyup.com` TCP **15502**)고 알려 주면.

## 준비 (한 번만)

- `D:\sso-check\` 에 `SsoLocalTest.java` 를 둔다.
- `D:\sso-check\lib\` 에 INITECH jar 7개가 있어야 한다(지난번 `SsoJarCheck` 때 넣은 그대로).
- PC 에 NexessClient(통합로그인)가 깔려 있어야 한다. 폴더: `C:\Users\Public\INITECH\INISAFE Nexess Client\NONGHYUP`

## 순서

1. 방화벽이 열렸는지 확인 — PowerShell 에서 아래 명령. 마지막 줄 `TcpTestSucceeded : True` 여야 한다.

```bash
Test-NetConnection 19.24.144.187 -Port 15502
```

2. 바탕화면 "통합로그인" 또는 작업표시줄 트레이 아이콘으로 **통합로그인에 로그인**한다(개발 서버).
3. 명령창(cmd)에서 아래 두 줄을 실행한다.

```bash
cd /d D:\sso-check
```

```bash
java -cp "lib\*" SsoLocalTest.java
```

4. Edge 가 열리지 않으면 주소창에 `http://127.0.0.1:18080/` 를 직접 연다.
5. **[테스트 시작]** 을 누른다. 7단계가 차례로 OK/NG 로 바뀐다(최대 1분).
6. **화면 전체 사진**과 **명령창 사진**을 김태균 선임에게 보낸다. 끝나면 명령창에서 `Ctrl+C`.

## 결과 보는 법

| 결과 | 뜻 | 할 일 |
|---|---|---|
| 7단계 모두 OK, 7번에 `SsoID=… TOA=…` | **성공.** SSO 연동 가능 확인 | 사진만 보낸다 |
| 1번 NG | NexessClient 폴더에 JS 파일이 없거나 이름이 다름 | 명령창 맨 위 `[NG] missing` 줄 사진 |
| 2번 NG "응답 없음" | 내 PC 의 NexessClient 가 대답 안 함 | 트레이 아이콘이 있는지 확인. Edge 로 `https://127.0.0.1:13015` 를 열어 본 화면도 사진 |
| 2·3번 NG (응답은 옴) | NexessClient 가 SSO 서버에 못 붙음 / 로그인 안 됨 | 1번 `Test-NetConnection` 결과, 통합로그인 다시 로그인 후 재시도 |
| 4번 NG "TOA=2/3" | 운영 통합로그인으로 로그인돼 있음 | 개발 통합로그인으로 다시 로그인 |
| 5·6번 NG | Ticket 발급 실패 | 사진만 보낸다 |
| 7번 NG | Ticket 은 받았으나 서버 쪽(jar)에서 풀지 못함 | 명령창 `[VERIFY]` 줄 사진 |

## 주의

- 통합로그인에서 **로그아웃하면 Edge·Chrome 이 강제로 꺼진다**(NCConfig `Logout View`). 저장 안 한 작업을 먼저 저장한다.
- 이 프로그램은 내 PC 안(`127.0.0.1`)에서만 열린다. 다른 PC 에서 접속할 수 없다.
- 화면에 보이는 SsoID 는 개인 ID 다. 보고 사진 외에 다른 곳에 올리지 않는다.
