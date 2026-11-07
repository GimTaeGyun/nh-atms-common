import { expect } from 'vitest';
import { waitFor, type waitForOptions } from '@testing-library/react';

/**
 * antd 모달이 닫혔나(닫히는 중 포함) — jsdom 은 닫힘 애니메이션이 끝나지 않아 DOM 이 남는다.
 * 문서에서 빠졌거나, 닫힘 애니메이션 클래스(`*-leave`)가 붙었거나, 숨겨졌으면(display:none) 닫힌 것으로 본다.
 */
export const isModalClosed = (dialog: HTMLElement): boolean => {
  if (!dialog.isConnected) return true;
  const wrap = dialog.closest('.ant-modal-wrap') as HTMLElement | null;
  const hidden = (el: HTMLElement | null) => !!el && el.style.display === 'none';
  return /-leave/.test(dialog.className) || hidden(dialog) || hidden(wrap);
};

/** 모달이 닫힐 때까지 기다린다. 예: `const dialog = await screen.findByRole('dialog'); … await waitForModalClosed(dialog);` */
export const waitForModalClosed = (dialog: HTMLElement, opts?: waitForOptions) => waitFor(() => expect(isModalClosed(dialog)).toBe(true), opts);
