import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.lang.reflect.InvocationTargetException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;

/**
 * 농협 SSO(Nexess Client) PC 단독 테스트 — ATMS 서버·배포 없이 이 PC 에서 끝까지 확인한다.
 * <pre>
 *   실행: java -cp "lib\*" SsoLocalTest.java            (lib = INITECH jar 7개, SsoJarCheck 와 같은 폴더)
 *   화면: http://127.0.0.1:18080/  →  [테스트 시작]
 *   단계: JS 파일 → NLS 주소 → 통합로그인 여부 → TOA → Ticket 준비 → Ticket 받기 → Ticket 풀기(SsoID·TOA)
 * </pre>
 * 가이드(INITECH 연동 가이드 3.4~3.7) 흐름을 그대로 따른다. 브라우저 쪽은 NexessClient 설치 폴더의
 * NexessDemonFunc_nonghyup.js·jquery 를 이 프로그램이 대신 내려준다. 127.0.0.1 에만 열린다.
 * 인자(생략 가능): [1] NexessClient 폴더  [2] 포트  [3] JS 파일 이름
 */
public class SsoLocalTest {

    static final String DEFAULT_NC_DIR = "C:\\Users\\Public\\INITECH\\INISAFE Nexess Client\\NONGHYUP";
    static final String DEFAULT_JS = "NexessDemonFunc_nonghyup.js";

    static Path ncDir;
    static String jsName;
    static volatile String nonce;

    public static void main(String[] args) throws Exception {
        ncDir = Paths.get(args.length > 0 ? args[0] : DEFAULT_NC_DIR);
        int port = args.length > 1 ? Integer.parseInt(args[1]) : 18080;
        jsName = args.length > 2 ? args[2] : DEFAULT_JS;

        // 가이드 index.jsp + cutCarriageReturn.jsp 의 암호 모듈 준비
        Class<?> provider = Class.forName("com.initech.provider.crypto.InitechProvider");
        provider.getMethod("addAsProvider", boolean.class, boolean.class).invoke(null, false, false);
        Object p = provider.getDeclaredConstructor().newInstance();
        p.getClass().getMethod("changeMode").invoke(p);
        Class.forName("com.initech.eam.nls.TicketV3");
        System.out.println("[OK] INITECH jar ready");

        for (String f : new String[] {jsName, "jquery-3.6.0.min.js"}) {
            Path path = ncDir.resolve(f);
            System.out.println((Files.isRegularFile(path) ? "[OK] " : "[NG] missing ") + path);
        }

        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);
        server.createContext("/", SsoLocalTest::handle);
        server.start();
        String url = "http://127.0.0.1:" + port + "/";
        System.out.println("[READY] open " + url + " in Edge  (stop: Ctrl+C)");
        try {
            java.awt.Desktop.getDesktop().browse(URI.create(url));
        } catch (Throwable ignore) {
            // 브라우저 자동 열기 실패 — 주소를 직접 연다
        }
    }

    static void handle(HttpExchange x) throws IOException {
        String path = x.getRequestURI().getPath();
        try {
            if (path.equals("/")) {
                send(x, 200, "text/html; charset=utf-8", PAGE.replace("@JS@", jsName).getBytes(StandardCharsets.UTF_8));
            } else if (path.equals("/nonce")) {
                byte[] b = new byte[8];
                new SecureRandom().nextBytes(b);
                nonce = Base64.getEncoder().encodeToString(b);
                send(x, 200, "text/plain; charset=utf-8", nonce.getBytes(StandardCharsets.UTF_8));
            } else if (path.equals("/verify")) {
                String ticket = new String(x.getRequestBody().readAllBytes(), StandardCharsets.UTF_8).trim();
                String r;
                try {
                    r = verify(ticket);
                } catch (Throwable t) {
                    r = "NG Ticket 풀기 실패: " + root(t);
                }
                System.out.println("[VERIFY] " + r);
                send(x, 200, "text/plain; charset=utf-8", r.getBytes(StandardCharsets.UTF_8));
            } else if (path.matches("/[A-Za-z0-9_.\\-]+\\.js")) {
                Path f = ncDir.resolve(path.substring(1));
                if (Files.isRegularFile(f)) send(x, 200, "application/javascript", Files.readAllBytes(f));
                else send(x, 404, "text/plain", ("not found: " + f).getBytes(StandardCharsets.UTF_8));
            } else {
                send(x, 404, "text/plain", "not found".getBytes(StandardCharsets.UTF_8));
            }
        } catch (Throwable t) {
            send(x, 500, "text/plain; charset=utf-8", ("ERROR " + root(t)).getBytes(StandardCharsets.UTF_8));
        }
    }

    /** 가이드 NCLoginTestEncVerifyTicket.jsp — Ticket = encNonce && encSKIPAndTime && encIDAndTOA */
    static String verify(String ticket) throws Exception {
        if (nonce == null) return "NG nonce 없음 (화면을 새로고침 후 다시)";
        int first = ticket.indexOf("&&");
        int last = ticket.lastIndexOf("&&");
        if (first < 0 || first == last) return "NG Ticket 모양이 다름 (&& 2개 아님), 길이=" + ticket.length();
        String encNonce = ticket.substring(0, first);
        String encSkipAndTime = ticket.substring(first + 2, last);
        String encIdAndToa = ticket.substring(last + 2);

        Class<?> t = Class.forName("com.initech.eam.nls.TicketV3");
        String decNonce = (String) t.getMethod("decryptNonce", String.class, String.class)
                .invoke(null, encSkipAndTime, encNonce);
        decNonce = decNonce == null ? "" : decNonce.replace("\r", "").replace("\n", "");
        if (!decNonce.equals(nonce)) return "NG nonce 불일치 (Ticket 이 이번 요청 것이 아님)";

        List<?> res = (List<?>) t.getMethod("readIDAndTOA", String.class, String.class)
                .invoke(null, encSkipAndTime, encIdAndToa);
        return "OK SsoID=" + res.get(0) + " TOA=" + res.get(1);
    }

    static void send(HttpExchange x, int status, String type, byte[] body) throws IOException {
        x.getResponseHeaders().set("Content-Type", type);
        x.getResponseHeaders().set("Cache-Control", "no-store");
        x.sendResponseHeaders(status, body.length);
        try (OutputStream os = x.getResponseBody()) {
            os.write(body);
        }
    }

    static Throwable root(Throwable t) {
        while (t instanceof InvocationTargetException && t.getCause() != null) t = t.getCause();
        return t;
    }

    static final String PAGE = """
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>SSO 테스트</title>
<script src="/@JS@"></script>
<style>
  body { font-family: 'Malgun Gothic', sans-serif; margin: 24px; background: #fff; color: #222; }
  table { border-collapse: collapse; margin-top: 16px; }
  td, th { border: 1px solid #ccc; padding: 6px 10px; text-align: left; vertical-align: top; }
  .OK { color: #0a7a2f; font-weight: bold; } .NG { color: #c62828; font-weight: bold; } .WAIT { color: #888; }
  #result { font-size: 20px; margin-top: 16px; font-weight: bold; }
  button { font-size: 18px; padding: 8px 24px; }
  .detail { font-family: Consolas, monospace; font-size: 12px; color: #555; max-width: 640px; word-break: break-all; }
</style>
</head>
<body>
<h2>농협 SSO(Nexess Client) PC 테스트</h2>
<div>통합로그인(트레이 아이콘)에 로그인한 뒤 누르세요. 끝나면 이 화면을 사진으로 보내 주세요.</div>
<p><button id="go">테스트 시작</button></p>
<table><thead><tr><th>#</th><th>단계</th><th>결과</th><th>내용</th></tr></thead><tbody id="rows"></tbody></table>
<div id="result"></div>
<script>
var STEPS = ['JS 파일 불러오기', 'NLS 주소 받기', '통합로그인 여부', 'TOA(로그인 종류)', 'Ticket 준비', 'Ticket 받기', 'Ticket 풀기(SsoID)'];
var FNS = ['Nexess_GetConnectNLSURL', 'Nexess_IsLogin', 'Nexess_GetLoginToa', 'Nexess_PrepareResession', 'Nexess_GetTicketWithNonce'];

function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
function draw() {
  var h = '';
  for (var i = 0; i < STEPS.length; i++) h += '<tr><td>' + (i + 1) + '</td><td>' + STEPS[i] + '</td><td id="s' + i + '" class="WAIT">-</td><td id="d' + i + '" class="detail"></td></tr>';
  document.getElementById('rows').innerHTML = h;
  document.getElementById('result').innerHTML = '';
}
function mark(i, ok, text) {
  var s = document.getElementById('s' + i);
  s.className = ok ? 'OK' : 'NG'; s.textContent = ok ? 'OK' : 'NG';
  document.getElementById('d' + i).textContent = text;
  if (!ok) throw { step: i };
}
function show(r) { var t = JSON.stringify(r); return t && t.length > 200 ? t.substring(0, 200) + '…' : t; }

// NexessClient 함수 호출 — 콜백이 첫 인자(가이드와 같음). 15초 안에 답이 없으면 실패
function call(fn, extra) {
  return new Promise(function (resolve, reject) {
    var done = false;
    var timer = setTimeout(function () { if (!done) { done = true; reject('응답 없음(15초) — NexessClient 실행 여부, https://127.0.0.1:13015 확인'); } }, 15000);
    try {
      window[fn].apply(null, [function (r) { if (!done) { done = true; clearTimeout(timer); resolve(r || {}); } }].concat(extra || []));
    } catch (e) { done = true; clearTimeout(timer); reject('호출 오류: ' + e); }
  });
}
function step(i, promise, check) {
  return promise.then(function (r) { return check(r); }, function (e) { mark(i, false, String(e)); });
}

function run() {
  draw();
  var nonce, ticket;
  Promise.resolve().then(function () {
    var missing = FNS.filter(function (f) { return typeof window[f] !== 'function'; });
    var found = Object.keys(window).filter(function (k) { return /^Nexess_/.test(k); });
    mark(0, missing.length === 0, missing.length ? '없는 함수: ' + missing.join(', ') + ' / 있는 함수: ' + (found.join(', ') || '없음') + ' / jQuery: ' + (typeof jQuery)
                                                 : 'jQuery ' + (window.jQuery ? jQuery.fn.jquery : '?') + ', 함수 5개 있음');
  }).then(function () {
    return step(1, call('Nexess_GetConnectNLSURL'), function (r) { mark(1, r.resultCode != '0', show(r)); });
  }).then(function () {
    return step(2, call('Nexess_IsLogin'), function (r) { mark(2, r.msg != 0, r.msg == 0 ? '로그인 안 됨 — 트레이 아이콘으로 통합로그인 후 다시 ' + show(r) : show(r)); });
  }).then(function () {
    return step(3, call('Nexess_GetLoginToa'), function (r) {
      var toa = String(r.msg);
      if (toa === '2' || toa === '3') mark(3, false, 'TOA=' + toa + ' 운영 통합로그인 — 개발 통합로그인(92·93)이어야 함');
      mark(3, true, 'TOA=' + toa + (toa === '92' ? ' (개발, 인증서)' : toa === '93' ? ' (개발, ID/PW)' : ' (처음 보는 값 — 사진 보내기)'));
    });
  }).then(function () {
    return fetch('/nonce').then(function (res) { return res.text(); }).then(function (n) { nonce = n; });
  }).then(function () {
    return step(4, call('Nexess_PrepareResession', [nonce]), function (r) { mark(4, r.resultCode == '1', show(r)); });
  }).then(function () {
    return step(5, call('Nexess_GetTicketWithNonce', [nonce]), function (r) {
      ticket = r.msg == null ? '' : String(r.msg);
      mark(5, ticket.length > 1, ticket.length > 1 ? 'Ticket 길이 ' + ticket.length : '빈 Ticket — 통합로그인 필요 ' + show(r));
    });
  }).then(function () {
    return fetch('/verify', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: ticket })
      .then(function (res) { return res.text(); })
      .then(function (t) { mark(6, t.indexOf('OK') === 0, t); });
  }).then(function () {
    document.getElementById('result').innerHTML = '<span class="OK">결과: 통과 — 위 7단계 모두 OK</span>';
  }, function (e) {
    var at = e && e.step !== undefined ? (e.step + 1) + '번 단계에서 멈춤' : esc(String(e));
    document.getElementById('result').innerHTML = '<span class="NG">결과: 실패 — ' + at + '</span>';
  });
}
document.getElementById('go').onclick = run;
</script>
</body>
</html>
""";
}
