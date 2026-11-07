import { useEffect, useEffectEvent, useRef, useState } from 'react';

/**
 * 인쇄 — 문서 제목(document.title)을 잠시 바꿔 출력 머리글/PDF 파일명에 화면 제목이 들어가게 하고, 인쇄가 끝나면 되돌린다.
 * print() 는 printing=true 로 한 번 렌더한 뒤 window.print() 를 부른다(printing 으로 인쇄용 내용을 그려도 반영됨).
 * 양식은 PrintLayout.
 */
export const usePrint = (title?: string) => {
  const [printing, setPrinting] = useState(false);
  const [request, setRequest] = useState(0);
  const saved = useRef<string | null>(null);

  const restoreTitle = () => {
    if (saved.current !== null) {
      document.title = saved.current;
      saved.current = null;
    }
  };

  const runPrint = useEffectEvent(() => {
    try {
      window.print(); // 대부분 브라우저에서 대화상자가 닫힐 때까지 막힌다
    } finally {
      restoreTitle();
      setPrinting(false);
    }
  });

  useEffect(() => {
    if (!request) return;
    const id = window.setTimeout(runPrint, 0);
    return () => window.clearTimeout(id);
  }, [request]);

  // 인쇄 중 언마운트 시에도 제목 복원
  useEffect(() => restoreTitle, []);

  const print = (override?: string) => {
    const t = override ?? title;
    if (t && saved.current === null) {
      saved.current = document.title;
      document.title = t;
    }
    setPrinting(true);
    setRequest((n) => n + 1);
  };

  return { printing, print };
};
