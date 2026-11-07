import { useMemo, useState } from 'react';
import { Button, Segmented, Select, Tabs } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { homeApi, cornerApi, boardApi } from '@/api';
import { qk } from '@/api/queryKeys';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOpenScreen } from '@/screens/navigation';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { PageFrame } from '@/components/page/PageFrame';
import { KpiCard } from '@/components/display/KpiCard';
import { SectionCard } from '@/components/display/SectionCard';
import { DataGrid } from '@/components/grid/DataGrid';
import { col, centerCol, atmStatusCol, ynCol } from '@/components/grid/columns';
import { fmtDate, fmtCount, fmtBool, fmtHoursRange } from '@/utils/format';
import { brand } from '@/config/brand';
import type { ScreenProps } from '@/types/screen';
import { OFFICE_GRADE_LABEL, type Atm, type HomeScope, type HomeScopeKind } from '@/domain/types';
import './home.css';

interface CornerRow { key: string; termId: string; time: string; inside: string; is365: boolean; cornerName: string; address: string; guardCo: string }

const SCOPE_LABEL: Record<HomeScopeKind, string> = { ALL: '전국', REGION: '영업본부별', OFFICE: '영업점별' };

/**
 * 0000 대시보드 — 시안(2026-10-21 p.2) 배치 + 현업 의견(2026-11-03, 24 문서 §5):
 *  ① 7일 장애 추이 삭제 → 그 자리에 공지사항  ② 관리 현황 '구분'(중앙본부·영업본부·영업점 등급별 선택)
 *  ③ 전국 운영률 TOP3 삭제 → 자동화기기 일평균 거래량(전일 영업일)  ④ 기기상태정보 표에 관리점·관리모점(코드) 신설, 해당 사무소 관리기기 전체
 */
const HomePage = ({ screenKey, active }: ScreenProps) => {
  const user = useAuthStore((s) => s.user);
  const openScreen = useOpenScreen();
  const officeCd = user?.officeCd ?? '000080';
  // 사용자가 고른 범위. 없으면 서버가 등급 기본값(중앙본부 전국 / 영업본부 해당 영본 / 영업점 해당 영업점)으로 준다
  const [sel, setSel] = useState<HomeScope | undefined>(undefined);
  const [atmFilter, setAtmFilter] = useState<'ALL' | 'FAULT'>('ALL');

  const summary = useQuery({ queryKey: [...qk.home.summary, officeCd, sel ?? null], queryFn: () => homeApi.summary(sel), refetchInterval: 60_000 });
  const scopeOptions = useQuery({ queryKey: qk.home.scopeOptions, queryFn: homeApi.scopeOptions });
  const notices = useQuery({ queryKey: qk.home.notices, queryFn: homeApi.notices });
  // 게시판 카드(결정 2): 공지사항은 홈 전용 API, 업무연락은 게시판 목록 API 첫 5건
  const [boardTab, setBoardTab] = useState<'NOTICE' | 'CONTACT'>('NOTICE');
  const contacts = useQuery({
    queryKey: qk.board.list({ catCd: 'CONTACT', page: 1, size: 6, home: true }),
    queryFn: () => boardApi.list({ catCd: 'CONTACT', page: 1, size: 6 }),
    enabled: boardTab === 'CONTACT',
  });
  const boardRows = boardTab === 'NOTICE' ? (notices.data ?? []) : (contacts.data?.content ?? []);
  const boardScreen = boardTab === 'NOTICE' ? 'board.notice' : 'board.bizContact';
  // 기기 표: 해당 사무소가 관리하는 기기 전체(현업 의견 ④)
  const office = useQuery({ queryKey: [...qk.home.atms, officeCd], queryFn: homeApi.atms });
  const corners = useQuery({ queryKey: qk.corner.list({ officeCd, home: true }), queryFn: () => cornerApi.list(officeCd) });

  const refreshAll = () => {
    void summary.refetch();
    void office.refetch();
  };
  useAutoRefresh(true, 60_000, refreshAll, active);

  const s = summary.data;
  const viewer = s?.viewer;
  const grade = viewer?.grade ?? 'BR';
  // 현재 적용 중인 범위(사용자 선택 → 없으면 등급 기본값)
  const current: HomeScope = sel ?? (grade === 'HQ' ? { scope: 'ALL' } : grade === 'RHQ' ? { scope: 'REGION', regionCd: viewer?.regionCd } : { scope: 'OFFICE', officeCd: viewer?.officeCd ?? officeCd });
  const kinds: HomeScopeKind[] = grade === 'HQ' ? ['ALL', 'REGION', 'OFFICE'] : grade === 'RHQ' ? ['REGION', 'OFFICE'] : ['OFFICE'];
  const regions = scopeOptions.data?.regions ?? [];
  const offices = useMemo(() => {
    const all = scopeOptions.data?.offices ?? [];
    return grade === 'RHQ' ? all.filter((o) => o.regionCd === viewer?.regionCd) : all;
  }, [scopeOptions.data, grade, viewer?.regionCd]);
  const changeKind = (kind: HomeScopeKind) => {
    if (kind === 'ALL') setSel({ scope: 'ALL' });
    else if (kind === 'REGION') setSel({ scope: 'REGION', regionCd: grade === 'RHQ' ? viewer?.regionCd : regions[0]?.code });
    else setSel({ scope: 'OFFICE', officeCd: grade === 'BR' ? viewer?.officeCd : offices[0]?.officeCd });
  };

  const atms: Atm[] = office.data ?? [];
  const atmRows = atmFilter === 'FAULT' ? atms.filter((a) => a.status !== '00') : atms;
  const cornerRows = corners.data?.rows ?? [];
  const sysName = `${brand.bankName ? 'NH ' : ''}자동화기기 종합관리시스템`;

  const atmColumns = [
    // 관리점·관리모점이 아직 안 오는 서버(백엔드 반영 전)면 소속 사무소로 대신 보인다
    col<Atm>('관리점', 'mngOfficeName', 120, { render: (v?: string) => v ?? viewer?.officeName ?? '-' }),
    centerCol<Atm>('관리점코드', 'mngOfficeCd', 90, { render: (v?: string, r?: Atm) => v ?? r?.officeCd }),
    col<Atm>('관리모점', 'parentOfficeName', 120, { render: (v?: string) => v ?? viewer?.officeName ?? '-' }),
    centerCol<Atm>('관리모점코드', 'parentOfficeCd', 100, { render: (v?: string, r?: Atm) => v ?? r?.officeCd }),
    centerCol<Atm>('기번', 'termId', 70),
    col<Atm>('제조사', 'vendorName', 100),
    col<Atm>('기종', 'kindName', 100),
    col<Atm>('모델명', 'modelName', 150),
    atmStatusCol<Atm>('기기상태', 'status', 100),
    col<Atm>('기기상태상세', 'errName', 170, { render: (v: string, r) => (v ? `${v} (${r.errCd})` : <span className="muted">-</span>) }),
    centerCol<Atm>('수표권종', 'checkDenom', 90),
    ynCol<Atm>('전자저널접속', 'journalConnected', 100),
    ynCol<Atm>('보안프로그램', 'securityInstalled', 100),
  ];

  return (
    <PageFrame screenKey={screenKey} title="대시보드" lastUpdated={summary.dataUpdatedAt || null} onRefresh={refreshAll} refreshing={summary.isFetching}>
      <div className="home-grid">
        <div className="home-span-7 home-left">
          {/* ── 머리띠(시안): 사무소 이름 + 등급 + 코드 ── */}
          <div className="home-hero">
            <div className="sys">{sysName}</div>
            <div className="nm">
              <b>{viewer?.officeName ?? user?.officeName ?? '-'}</b>
              <span className="grade">{OFFICE_GRADE_LABEL[grade]}</span>
            </div>
            <div className="cd">사무소 코드 :<b>{viewer?.officeCd ?? officeCd}</b></div>
          </div>

          {/* ── 자동화기기 관리 현황 + 구분(현업 의견 ②) ── */}
          <div className="flex-between">
            <div className="section-title">
              자동화기기 관리 현황
              <span className="home-scope">
                <Select<HomeScopeKind> size="small" value={current.scope} onChange={changeKind} disabled={grade === 'BR'} style={{ width: 110 }} options={kinds.map((k) => ({ value: k, label: grade === 'RHQ' && k === 'REGION' ? '영업본부' : grade === 'BR' ? '영업점' : SCOPE_LABEL[k] }))} aria-label="구분" />
                {current.scope === 'REGION' && grade === 'HQ' && (
                  <Select size="small" value={current.regionCd} onChange={(v) => setSel({ scope: 'REGION', regionCd: v })} style={{ width: 130 }} options={regions.map((r) => ({ value: r.code, label: `${r.name}영업본부` }))} aria-label="영업본부" />
                )}
                {current.scope === 'OFFICE' && grade !== 'BR' && (
                  <Select size="small" showSearch optionFilterProp="label" value={current.officeCd} onChange={(v) => setSel({ scope: 'OFFICE', officeCd: v })} style={{ width: 210 }} options={offices.map((o) => ({ value: o.officeCd, label: `[${o.officeCd}] ${o.officeName}` }))} aria-label="영업점" />
                )}
              </span>
            </div>
            <Button type="link" size="small" onClick={() => openScreen('mgmt.faultStatus')}>
              상세보기 <RightOutlined />
            </Button>
          </div>
          <div className="home-kpi-row">
            {/* 총 대수 + 일평균 거래량(현업 의견 ③, TOP3 자리) */}
            <div className="kpi-card home-total">
              <div className="ht-left">
                <div className="lbl">총 자동화기기 운영 대수</div>
                <div className="kpi-value">
                  {s?.total === undefined ? '-' : fmtCount(s.total)}
                  <small>대</small>
                </div>
                <div className="kpi-sub">{s?.scopeName ?? ''} · {s?.asOf ?? '-'} 기준</div>
              </div>
              <div className="home-avgtx">
                <div className="t">자동화기기 일평균 거래량</div>
                <div className="v">
                  {s?.avgDailyTx === undefined || s?.avgDailyTx === null ? '-' : fmtCount(s.avgDailyTx)}
                  <small>건</small>
                </div>
                <div className="d">{s?.avgDailyTxAsOf ?? '-'} 기준(전일 영업일, 기기 1대당)</div>
              </div>
            </div>
            <div className="home-kpis">
              <KpiCard label="정상" tone="success" value={s?.normal} delta={s?.deltaNormal} onClick={() => openScreen('mgmt.faultStatus')} />
              <KpiCard label="장애" tone="danger" value={s?.fault} delta={s?.deltaFault} deltaGoodWhenUp={false} onClick={() => openScreen('mgmt.faultHistory')} />
              <KpiCard label="점검 필요" tone="warning" value={s?.check} delta={s?.deltaCheck} deltaGoodWhenUp={false} onClick={() => openScreen('outsrc.atmStatus')} />
              <KpiCard label="중지(미운영)" tone="neutral" value={s?.stopped} delta={s?.deltaStopped} deltaGoodWhenUp={false} onClick={() => openScreen('closing.openCloseReg')} />
            </div>
          </div>
        </div>

        {/* ── 공지사항(현업 의견 ①: 7일 추이 자리) ── */}
        <div className="home-span-5">
          <SectionCard
            className="home-notice"
            title={
              <span className="board-tabs" role="tablist" aria-label="게시판">
                <button type="button" role="tab" aria-selected={boardTab === 'NOTICE'} className={boardTab === 'NOTICE' ? 'on' : ''} onClick={() => setBoardTab('NOTICE')}>자동화기기 공지사항</button>
                <button type="button" role="tab" aria-selected={boardTab === 'CONTACT'} className={boardTab === 'CONTACT' ? 'on' : ''} onClick={() => setBoardTab('CONTACT')}>업무연락</button>
              </span>
            }
            extra={<Button type="link" size="small" onClick={() => openScreen(boardScreen)}>전체보기 <RightOutlined /></Button>}
            bodyStyle={{ paddingTop: 8 }}
          >
            <ul className="notice-list">
              {boardTab === 'CONTACT' && contacts.isLoading && <li className="muted">불러오는 중…</li>}
              {boardRows.map((n) => (
                <li key={n.seqNo} onClick={() => openScreen(boardScreen)}>
                  <span className="t ellipsis">{n.subject}</span>
                  <span className="d">{fmtDate(n.writeDate, '/').slice(2)}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        {/* ── 기기 표 3탭(시안) — 해당 사무소 관리기기 전체(현업 의견 ④) ── */}
        <div className="home-span-12">
          <SectionCard
            bodyStyle={{ paddingTop: 8 }}
            extra={
              <Segmented<'ALL' | 'FAULT'>
                size="small"
                value={atmFilter}
                options={[
                  { value: 'ALL', label: `전체 ${fmtCount(atms.length)}대` },
                  { value: 'FAULT', label: `장애 ${fmtCount(atms.filter((a) => a.status !== '00').length)}대` },
                ]}
                onChange={setAtmFilter}
                className="no-print"
              />
            }
            title={<span className="sub" style={{ fontWeight: 500 }}>[{viewer?.officeCd ?? officeCd}] {viewer?.officeName ?? user?.officeName} 관리기기</span>}
          >
            <Tabs
              size="small"
              className="home-tabs"
              items={[
                {
                  key: 'status',
                  label: '기기상태정보',
                  children: <DataGrid<Atm> rows={atmRows} rowKey={(a) => `${a.officeCd}-${a.termId}`} loading={office.isLoading} grade="G2" clientPageSize={0} onRowDoubleClick={() => openScreen('mgmt.faultStatus')} columns={atmColumns} />,
                },
                {
                  key: 'corner',
                  label: '운영시간(코너)정보',
                  children: (
                    <DataGrid<CornerRow>
                      rows={cornerRows.flatMap<CornerRow>((c) => (c.atms.length ? c.atms.map((a) => ({ key: `${c.cornerCd}-${a.termId}`, termId: a.termId, time: fmtHoursRange(c.serviceStart, c.serviceEnd), inside: fmtBool(c.inside, '점내', '점외'), is365: c.is365, cornerName: c.cornerName, address: c.address, guardCo: c.guardCo })) : [{ key: c.cornerCd, termId: '-', time: fmtHoursRange(c.serviceStart, c.serviceEnd), inside: fmtBool(c.inside, '점내', '점외'), is365: c.is365, cornerName: c.cornerName, address: c.address, guardCo: c.guardCo }]))}
                      rowKey="key"
                      loading={corners.isLoading}
                      grade="G2"
                      clientPageSize={0}
                      columns={[
                        centerCol<CornerRow>('기번', 'termId', 70),
                        centerCol<CornerRow>('운영시간', 'time', 130),
                        centerCol<CornerRow>('위치구분', 'inside', 90),
                        centerCol<CornerRow>('365운영', 'is365', 80, { render: (v: boolean) => fmtBool(v, 'O', 'X') }),
                        col<CornerRow>('코너명', 'cornerName', 200),
                        col<CornerRow>('위치', 'address', 260),
                        col<CornerRow>('경비업체', 'guardCo', 120),
                      ]}
                    />
                  ),
                },
                {
                  key: 'outsrc',
                  label: '일괄용역기기정보',
                  children: <DataGrid<Atm> rows={atmRows.filter((a) => a.outsrc)} rowKey={(a) => `${a.officeCd}-${a.termId}`} loading={office.isLoading} grade="G2" clientPageSize={0} onRowDoubleClick={() => openScreen('outsrc.atmStatus')} columns={atmColumns} />,
                },
              ]}
            />
          </SectionCard>
        </div>
      </div>
    </PageFrame>
  );
};
export default HomePage;
