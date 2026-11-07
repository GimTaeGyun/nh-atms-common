import { act, renderHook } from '@testing-library/react';
import { App } from 'antd';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { matchAccept, useFileUpload, type UploadedFile } from '../useFileUpload';

const wrapper = ({ children }: { children: ReactNode }) => <App>{children}</App>;
const makeFile = (name: string, size: number, type = 'application/pdf') => {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};

describe('useFileUpload', () => {
  it('크기 초과 파일은 업로드하지 않고 거부한다', async () => {
    const upload = vi.fn();
    const { result } = renderHook(() => useFileUpload({ upload, maxSizeMb: 1 }), { wrapper });
    let r: unknown;
    await act(async () => {
      r = await result.current.add(makeFile('big.pdf', 1024 * 1024 + 1));
    });
    expect(r).toBeNull();
    expect(upload).not.toHaveBeenCalled();
    expect(result.current.items).toHaveLength(0);
    expect(result.current.validate(makeFile('big.pdf', 2 * 1024 * 1024))).toContain('1MB');
  });

  it('업로드 성공: uploading(진행률) → done(fileId), onChange 로 완료 목록 전달', async () => {
    let finish: (v: UploadedFile) => void = () => {};
    let progress: (p: number) => void = () => {};
    const upload = vi.fn((_: File, onProgress: (p: number) => void) => {
      progress = onProgress;
      return new Promise<UploadedFile>((res) => {
        finish = res;
      });
    });
    const onChange = vi.fn();
    const { result } = renderHook(() => useFileUpload({ upload, accept: '.pdf,image/*', onChange }), { wrapper });

    let pending: Promise<unknown> = Promise.resolve();
    act(() => {
      pending = result.current.add(makeFile('a.pdf', 2048));
    });
    expect(result.current.items[0]).toMatchObject({ name: 'a.pdf', status: 'uploading', progress: 0 });
    expect(result.current.uploading).toBe(true);
    act(() => progress(42.4));
    expect(result.current.items[0].progress).toBe(42);

    await act(async () => {
      finish({ fileId: 'F1', fileName: 'a.pdf', size: 2048 });
      await pending;
    });
    expect(result.current.items[0]).toMatchObject({ status: 'done', progress: 100, fileId: 'F1' });
    expect(result.current.uploading).toBe(false);
    expect(onChange).toHaveBeenLastCalledWith([{ fileId: 'F1', fileName: 'a.pdf', size: 2048 }]);

    act(() => result.current.remove(result.current.items[0].uid));
    expect(result.current.items).toHaveLength(0);
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('업로드 실패 → error 상태', async () => {
    const { result } = renderHook(() => useFileUpload({ upload: async () => Promise.reject(new Error('서버 오류')) }), { wrapper });
    await act(async () => {
      await result.current.add(makeFile('b.pdf', 10));
    });
    expect(result.current.items[0]).toMatchObject({ status: 'error', error: '서버 오류' });
  });

  it('matchAccept: 확장자·MIME 와일드카드', () => {
    expect(matchAccept({ name: 'x.PDF', type: 'application/pdf' }, '.pdf')).toBe(true);
    expect(matchAccept({ name: 'x.png', type: 'image/png' }, '.pdf,image/*')).toBe(true);
    expect(matchAccept({ name: 'x.exe', type: 'application/x-msdownload' }, '.pdf,image/*')).toBe(false);
    expect(matchAccept({ name: 'x.exe' })).toBe(true);
  });
});
