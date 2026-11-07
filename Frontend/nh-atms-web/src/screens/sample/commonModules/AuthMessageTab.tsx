/**
 * 탭 6 권한·메시지 — 나(/api/me), 이 화면의 메뉴 권한 5개, 권한 미리보기 스위치 + 표준 버튼 12종(ActionBar)·AuthButton·AuthGuard,
 * 하단 메시지 라인(pushMessage), 확인창 문구(CMSG), 서버 오류 문구 전역 표시, 표시 부품(DisplayShowcase), 자동 새로고침.
 * 권한 미리보기는 **화면 표시만 바꾼다. 서버 검사는 언제나 DB(TB_SCR_AUTH_MENU) 기준**.
 */
import { Button, Popconfirm, Radio, Space } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { lookupApi } from '@/api/endpoints/lookup';
import { toAppError } from '@/api/errors';
import { ActionBar, ACTION_DEFS, type ActionKey } from '@/components/auth/ActionBar';
import { AuthButton, AuthGuard } from '@/components/auth/AuthButton';
import { DetailGrid } from '@/components/display/DetailGrid';
import { YnIcon } from '@/components/display/StatusTag';
import { MessageLine } from '@/components/feedback/MessageLine';
import { CMSG } from '@/config/messages';
import type { DistinctTarget } from '@/domain/lookup';
import { usePermission } from '@/hooks/usePermission';
import { useAuthStore } from '@/stores/useAuthStore';
import { findMenuByScreen, useNavStore } from '@/stores/useNavStore';
import { pushMessage, type MessageLevel } from '@/stores/useMessageLineStore';
import { PERM_PREVIEW_OPTIONS, usePermPreviewStore, type PermPreview } from '@/stores/usePermPreviewStore';
import type { ScreenKey } from '@/types/screen';
import { fmtOffice } from '@/utils/format';
import { Demo, DemoGrid, EchoJson } from './CodeSample';
import { AutoRefreshDemo, DisplayShowcase } from './DisplayShowcase';

/** 표준 버튼 12종 전부 */
export const ALL_ACTION_KEYS = Object.keys(ACTION_DEFS) as ActionKey[];

/** 화면에 보이는 미리보기 안내 */
export const PREVIEW_NOTE = '표시만 바꿈, 서버 검사는 DB 기준';

const FLAGS = [['조회', 'qryRolYn', 'canQry'], ['등록', 'regRolYn', 'canReg'], ['수정', 'updRolYn', 'canUpd'], ['삭제', 'delRolYn', 'canDel'], ['업무실행', 'exeRolYn', 'canExe']] as const;

const LEVELS: { level: MessageLevel; label: string }[] = [{ level: 'info', label: '안내' }, { level: 'success', label: '완료' }, { level: 'warn', label: '주의' }, { level: 'error', label: '오류' }];

const AuthMessageTab = ({ screenKey, active }: { screenKey: ScreenKey; active: boolean }) => {
  const me = useAuthStore((s) => s.me);
  const meStatus = useAuthStore((s) => s.status);
  const meError = useAuthStore((s) => s.error);
  const loadMe = useAuthStore((s) => s.loadMe);
  const menus = useNavStore((s) => s.menus);
  const node = findMenuByScreen(menus, screenKey);
  const perm = usePermission(screenKey);
  const preview = usePermPreviewStore((s) => s.preview);
  const setPreview = usePermPreviewStore((s) => s.setPreview);
  // 서버 오류 시연: 허용 목록 밖 대상 → 400 LKP_002. 화면은 try/catch 없이 전역 onError 가 서버 문구를 띄운다
  const bad = useMutation({ mutationFn: () => lookupApi.distinct('unknown' as DistinctTarget) });
  const notFound = useMutation({ mutationFn: () => lookupApi.office('999999') });
  const lastErr = bad.error ?? notFound.error;
  const err = lastErr ? toAppError(lastErr) : null;

  return (
    <>
      <DemoGrid>
        <Demo
          title="나 (GET /api/me)"
          desc="로그인 없이 설정의 고정 개인번호로 서버가 TB_INSA·TB_SCR_AUTH 를 읽어 준다."
          code={`const me = useAuthStore((s) => s.me);   // 앱 시작 때 loadMe()
const ofcCode = useAuthStore(selectOfcCode);   // 조회조건 기본 사무소`}
        >
          <DetailGrid
            cols={2}
            labelWidth={90}
            items={[
              { label: '개인번호', value: me?.perNo ?? '-' },
              { label: '성명', value: me?.name ?? '-' },
              { label: '소속', value: fmtOffice(me?.samuso, me?.samusoName) },
              { label: '권한 사무소', value: fmtOffice(me?.ofcCode, me?.kanm) },
              { label: '부서코드', value: me?.deptCode ?? '-' },
              { label: '권한/관리자', value: `${me?.auth ?? '-'} / ${me?.adminYn ?? '-'}` },
            ]}
          />
          {meError && <EchoJson value={meError} label="오류" />}
          <Button size="small" style={{ marginTop: 8 }} onClick={() => void loadMe(true)} loading={meStatus === 'loading'}>
            다시 읽기
          </Button>
        </Demo>
        <Demo
          title="이 화면의 내 권한 (메뉴 플래그 5개)"
          desc={`메뉴 응답(/api/menu/my)의 TB_SCR_AUTH_MENU 플래그. 오른쪽은 미리보기를 얹은 값 — ${PREVIEW_NOTE}.`}
          code={`const { canQry, canReg, canUpd, canDel, canExe, isAdmin } = usePermission(screenKey);
// 쓰기 API 는 서버도 @RequireMenuAuth(screen = "<화면키>", need = Perm.REG) 로 다시 검사(403 SYS_403)`}
        >
          <table className="perm-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr>
                <th>권한</th>
                <th>메뉴(DB)</th>
                <th>화면 표시</th>
              </tr>
            </thead>
            <tbody>
              {FLAGS.map(([label, flag, can]) => (
                <tr key={flag} data-flag={flag}>
                  <td>{label}</td>
                  <td>{node ? <YnIcon value={node[flag]} /> : <span className="muted">메뉴 없음</span>}</td>
                  <td data-testid={`perm-${can}`}>
                    <YnIcon value={perm[can]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>관리자 {perm.isAdmin ? 'Y' : 'N'} · 메뉴 {node ? `${node.menuId} ${node.menuNm}` : '없음(조회만)'}</div>
        </Demo>
      </DemoGrid>

      <Demo
        title="권한 미리보기 + 표준 버튼 12종 (usePermPreviewStore · ActionBar · AuthButton · AuthGuard)"
        desc={`스위치를 바꾸면 버튼이 흐려진다(기본 disable + 툴팁 '권한이 없습니다.', mode="hide" 면 숨김). ${PREVIEW_NOTE}.`}
        code={`<ActionBar screenKey={screenKey} hotkeys actions={['search', 'excel', 'create', { key: 'delete', onClick: remove, disabled: !checked.length }]} onAction={handle} />
<AuthButton need="upd" screenKey={screenKey} onClick={save}>저장</AuthButton>
<AuthGuard need="del" fallback={<span>삭제 권한 없음</span>}>…</AuthGuard>`}
      >
        <Space wrap style={{ marginBottom: 10 }}>
          <span>권한 미리보기</span>
          <Radio.Group optionType="button" buttonStyle="solid" value={preview} onChange={(e) => setPreview(e.target.value as PermPreview)} options={PERM_PREVIEW_OPTIONS} aria-label="권한 미리보기" />
          <span className="muted">({PREVIEW_NOTE})</span>
        </Space>
        <ActionBar className="demo-action-bar" screenKey={screenKey} align="left" hotkeys actions={ALL_ACTION_KEYS} onAction={(k) => void pushMessage('info', `[${ACTION_DEFS[k].label}] 버튼을 눌렀습니다.`, screenKey)} />
        <Space wrap style={{ marginTop: 10 }}>
          <AuthButton screenKey={screenKey} need="reg" onClick={() => pushMessage('info', 'AuthButton(reg) 눌림', screenKey)}>
            등록 권한 버튼
          </AuthButton>
          <AuthButton screenKey={screenKey} need="exe" onClick={() => pushMessage('info', 'AuthButton(exe) 눌림', screenKey)}>
            업무실행 버튼
          </AuthButton>
          <AuthButton screenKey={screenKey} need="del" mode="hide" danger>
            삭제 권한 버튼(숨김형)
          </AuthButton>
          <AuthButton screenKey={screenKey} need="admin">
            관리자 버튼
          </AuthButton>
          <AuthGuard screenKey={screenKey} need="upd" fallback={<span className="muted" data-testid="guard-fallback">수정 권한이 없어 편집 영역을 숨겼습니다.</span>}>
            <span data-testid="guard-content">수정 권한이 있어 편집 영역이 보입니다.</span>
          </AuthGuard>
        </Space>
      </Demo>

      <DemoGrid>
        <Demo
          title="하단 메시지 라인 (MessageLine + pushMessage)"
          desc="AS-IS 메시지라인. React 밖에서도 pushMessage 로 넣는다. 최근 20건, 말풍선으로 목록."
          code={`pushMessage('info', '조회했습니다.', screenKey);
<MessageLine screenKey={screenKey} />`}
        >
          <Space wrap style={{ marginBottom: 8 }}>
            {LEVELS.map((l) => (
              <Button key={l.level} size="small" onClick={() => pushMessage(l.level, `${l.label} 메시지 견본입니다.`, screenKey)}>
                {l.label}
              </Button>
            ))}
          </Space>
          <MessageLine screenKey={screenKey} />
        </Demo>
        <Demo
          title="서버 성공·오류 문구"
          desc="문구는 서버(api-messages.tsv → T_API_MESSAGE)가 만든다. 성공은 http.ts 가, 실패는 react-query 전역 onError 가 띄운다 → 화면에 message.success·try/catch 를 쓰지 않는다."
          code={`const remove = useMutation({ mutationFn: (nos) => noticeApi.remove(nos),
  onSuccess: () => qc.invalidateQueries({ queryKey: noticeKeys.all }) });   // 성공 문구도 서버가`}
          echo={err ? { status: err.status ?? null, code: err.code ?? null, message: err.userMessage } : null}
          echoLabel="마지막 오류"
        >
          <Space wrap>
            <Button danger onClick={() => bad.mutate()} loading={bad.isPending}>
              400 LKP_002 부르기
            </Button>
            <Button onClick={() => notFound.mutate()} loading={notFound.isPending}>
              404 사무소 없음
            </Button>
          </Space>
        </Demo>
        <Demo title="확인창 문구 (CMSG)" desc="말투는 '~하시겠습니까?' 하나로. ActionBar 의 삭제는 CMSG.delete 가 기본." code={`<Popconfirm title={CMSG.deleteTarget('코너 [001] 본점')} onConfirm={remove}>…</Popconfirm>
CMSG.deleteSelected(3)   // 선택한 3건을 삭제하시겠습니까?`}>
          <ul style={{ margin: '0 0 8px', paddingLeft: 18 }}>
            {[CMSG.delete, CMSG.deleteTarget('코너 [001] 본점'), CMSG.deleteSelected(3), CMSG.deleteSelected(2, 'C/S 이력'), CMSG.approveTarget('이 홍보문구'), CMSG.menuDisable].map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <Popconfirm title={CMSG.deleteSelected(3)} okText="예" cancelText="아니오" onConfirm={() => pushMessage('warn', '확인을 눌렀습니다(견본 — 삭제하지 않음).', screenKey)}>
            <Button size="small">확인창 띄우기</Button>
          </Popconfirm>
        </Demo>
        <AutoRefreshDemo active={active} />
      </DemoGrid>
      <DisplayShowcase />
    </>
  );
};

export default AuthMessageTab;
