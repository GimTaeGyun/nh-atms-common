import { useEffect, useRef, useState } from 'react';

/** 서버가 돌려주는 명령 상태 */
export type CommandServerState = 'PENDING' | 'RUNNING' | 'DONE' | 'FAIL' | 'TIMEOUT';

export interface CommandStatus<R = unknown> {
  state: CommandServerState;
  message?: string;
  result?: R;
}

/** 화면 상태: 발행 전(IDLE) → 발행 중(ISSUING) → 대기/실행(PENDING/RUNNING) → 종료(DONE/FAIL/TIMEOUT/CANCELED) */
export type CommandPhase = 'IDLE' | 'ISSUING' | 'PENDING' | 'RUNNING' | 'DONE' | 'FAIL' | 'TIMEOUT' | 'CANCELED';

/** run() 의 최종 결과 */
export interface CommandOutcome<R = unknown> {
  state: Extract<CommandPhase, 'DONE' | 'FAIL' | 'TIMEOUT' | 'CANCELED'>;
  cmdId: string | null;
  message?: string;
  result?: R;
}

export interface UseCommandPollOptions<A, R> {
  /** 명령 발행 → cmdId */
  issue: (args: A) => Promise<{ cmdId: string }>;
  /** 명령 상태 조회 */
  status: (cmdId: string) => Promise<CommandStatus<R>>;
  /** 폴링 간격(ms), 기본 2000 */
  intervalMs?: number;
  /** 발행부터 최대 대기(ms), 기본 60000 — 넘으면 TIMEOUT */
  timeoutMs?: number;
  onDone?: (outcome: CommandOutcome<R>) => void;
  /** FAIL·TIMEOUT(서버/클라이언트)·발행 오류 */
  onFail?: (outcome: CommandOutcome<R>) => void;
}

const TIMEOUT_MSG = '기기 응답 시간이 초과되었습니다. 실행결과를 확인하세요.';
const errText = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

/**
 * 원격명령 발행 → cmdId → 상태 폴링 → 완료/실패/시간초과 (개국/합계 등록, 리셋 명령 등).
 * 화면을 닫으면(언마운트) 폴링을 멈춘다. 다시 run() 하면 이전 폴링은 취소된다.
 */
export const useCommandPoll = <A = void, R = unknown>(options: UseCommandPollOptions<A, R>) => {
  const opts = useRef(options);
  useEffect(() => {
    opts.current = options;
  });

  const [phase, setPhase] = useState<CommandPhase>('IDLE');
  const [cmdId, setCmdId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | undefined>();
  const [result, setResult] = useState<R | undefined>();

  const token = useRef(0);
  const timers = useRef<{ poll?: number; limit?: number }>({});
  const settle = useRef<((o: CommandOutcome<R>) => void) | null>(null);
  const idRef = useRef<string | null>(null);

  const clearTimers = () => {
    window.clearTimeout(timers.current.poll);
    window.clearTimeout(timers.current.limit);
    timers.current = {};
  };

  // 언마운트: 진행 중 폴링 중단(상태 갱신 없음)
  useEffect(
    () => () => {
      token.current++;
      window.clearTimeout(timers.current.poll);
      window.clearTimeout(timers.current.limit);
      settle.current?.({ state: 'CANCELED', cmdId: null });
      settle.current = null;
    },
    [],
  );

  const finish = (my: number, o: CommandOutcome<R>) => {
    if (my !== token.current) return;
    token.current++; // 이후 도착하는 응답 무시
    clearTimers();
    setPhase(o.state);
    setMessage(o.message);
    setResult(o.result);
    if (o.state === 'DONE') opts.current.onDone?.(o);
    else if (o.state !== 'CANCELED') opts.current.onFail?.(o);
    settle.current?.(o);
    settle.current = null;
  };

  /** 진행 중 폴링 취소 (서버 명령 자체는 취소하지 않는다) */
  const cancel = () => {
    if (!settle.current) return;
    finish(token.current, { state: 'CANCELED', cmdId: idRef.current, message: '조회를 중단했습니다.' });
  };

  const run = (args: A): Promise<CommandOutcome<R>> => {
    cancel();
    const my = ++token.current;
    const { intervalMs = 2000, timeoutMs = 60_000 } = opts.current;
    setPhase('ISSUING');
    setCmdId(null);
    setMessage(undefined);
    setResult(undefined);

    const done = new Promise<CommandOutcome<R>>((resolve) => {
      settle.current = resolve;
    });

    idRef.current = null;
    timers.current.limit = window.setTimeout(() => finish(my, { state: 'TIMEOUT', cmdId: idRef.current, message: TIMEOUT_MSG }), timeoutMs);

    const poll = async () => {
      const currentId = idRef.current;
      if (my !== token.current || !currentId) return;
      let s: CommandStatus<R>;
      try {
        s = await opts.current.status(currentId);
      } catch (e) {
        finish(my, { state: 'FAIL', cmdId: currentId, message: errText(e, '명령 상태를 조회하지 못했습니다.') });
        return;
      }
      if (my !== token.current) return;
      if (s.state === 'DONE' || s.state === 'FAIL' || s.state === 'TIMEOUT') {
        finish(my, { state: s.state, cmdId: currentId, message: s.state === 'TIMEOUT' ? (s.message ?? TIMEOUT_MSG) : s.message, result: s.result });
        return;
      }
      setPhase(s.state);
      setMessage(s.message);
      timers.current.poll = window.setTimeout(() => void poll(), intervalMs);
    };

    void (async () => {
      try {
        const res = await opts.current.issue(args);
        if (my !== token.current) return;
        idRef.current = res.cmdId;
        setCmdId(res.cmdId);
        setPhase('PENDING');
        timers.current.poll = window.setTimeout(() => void poll(), intervalMs);
      } catch (e) {
        finish(my, { state: 'FAIL', cmdId: null, message: errText(e, '명령을 전송하지 못했습니다.') });
      }
    })();

    return done;
  };

  const running = phase === 'ISSUING' || phase === 'PENDING' || phase === 'RUNNING';
  return { run, cancel, state: phase, cmdId, message, result, running };
};
