import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCommandPoll, type CommandStatus } from '../useCommandPoll';

describe('useCommandPoll', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('발행 → PENDING → RUNNING → DONE 이면 onDone', async () => {
    const seq: CommandStatus<string>[] = [{ state: 'PENDING' }, { state: 'RUNNING', message: '실행 중' }, { state: 'DONE', message: '정상', result: 'OK' }];
    const issue = vi.fn(async (_: { mcnNo: string }) => ({ cmdId: 'C1' }));
    const status = vi.fn(async () => seq.shift()!);
    const onDone = vi.fn();
    const onFail = vi.fn();
    const { result } = renderHook(() => useCommandPoll({ issue, status, intervalMs: 1000, timeoutMs: 10_000, onDone, onFail }));

    let outcome: Promise<unknown> | undefined;
    act(() => {
      outcome = result.current.run({ mcnNo: '001' });
    });
    expect(result.current.running).toBe(true);
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(issue).toHaveBeenCalledWith({ mcnNo: '001' });
    expect(result.current.cmdId).toBe('C1');
    expect(result.current.state).toBe('PENDING');

    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(status).toHaveBeenCalledTimes(1);
    expect(result.current.state).toBe('PENDING');
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(result.current.state).toBe('RUNNING');
    expect(result.current.message).toBe('실행 중');
    await act(() => vi.advanceTimersByTimeAsync(1000));

    expect(result.current.state).toBe('DONE');
    expect(result.current.running).toBe(false);
    expect(result.current.result).toBe('OK');
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ state: 'DONE', cmdId: 'C1', result: 'OK' }));
    expect(onFail).not.toHaveBeenCalled();
    await expect(outcome).resolves.toMatchObject({ state: 'DONE' });

    // 종료 후에는 더 폴링하지 않는다
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(status).toHaveBeenCalledTimes(3);
  });

  it('응답이 계속 PENDING 이면 timeoutMs 에 TIMEOUT + onFail', async () => {
    const status = vi.fn(async (): Promise<CommandStatus> => ({ state: 'PENDING' }));
    const onDone = vi.fn();
    const onFail = vi.fn();
    const { result } = renderHook(() => useCommandPoll<void>({ issue: async () => ({ cmdId: 'C2' }), status, intervalMs: 2000, timeoutMs: 7000, onDone, onFail }));

    act(() => {
      void result.current.run();
    });
    await act(() => vi.advanceTimersByTimeAsync(6999));
    expect(result.current.state).toBe('PENDING');
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(result.current.state).toBe('TIMEOUT');
    expect(onFail).toHaveBeenCalledWith(expect.objectContaining({ state: 'TIMEOUT', cmdId: 'C2' }));
    expect(onDone).not.toHaveBeenCalled();
    const calls = status.mock.calls.length;
    await act(() => vi.advanceTimersByTimeAsync(10_000));
    expect(status.mock.calls.length).toBe(calls);
  });

  it('서버 FAIL → onFail, 언마운트 시 폴링 중단', async () => {
    const onFail = vi.fn();
    const { result } = renderHook(() => useCommandPoll<void>({ issue: async () => ({ cmdId: 'C3' }), status: async () => ({ state: 'FAIL', message: '기기 무응답' }), intervalMs: 500, onFail }));
    act(() => {
      void result.current.run();
    });
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(result.current.state).toBe('FAIL');
    expect(onFail).toHaveBeenCalledWith(expect.objectContaining({ message: '기기 무응답' }));

    const status = vi.fn(async (): Promise<CommandStatus> => ({ state: 'RUNNING' }));
    const h = renderHook(() => useCommandPoll<void>({ issue: async () => ({ cmdId: 'C4' }), status, intervalMs: 500 }));
    act(() => {
      void h.result.current.run();
    });
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(status).toHaveBeenCalledTimes(1);
    h.unmount();
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(status).toHaveBeenCalledTimes(1);
  });
});
