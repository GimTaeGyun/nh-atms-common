import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useAppMessage } from './useAppMessage';
import { VMSG } from '@/config/messages';

/** 서버에 올라간 파일 */
export interface UploadedFile {
  fileId: string;
  fileName: string;
  size: number;
}

export type AttachStatus = 'uploading' | 'done' | 'error';

/** 첨부 목록 1건 */
export interface AttachItem {
  uid: string;
  name: string;
  size: number;
  status: AttachStatus;
  /** 0~100 */
  progress: number;
  fileId?: string;
  error?: string;
}

export interface UseFileUploadOptions {
  /** 업로드 API — onProgress(0~100) 를 불러 진행률을 알린다 */
  upload: (file: File, onProgress: (percent: number) => void) => Promise<UploadedFile>;
  /** 파일 1개 최대 크기(MB), 기본 10 */
  maxSizeMb?: number;
  /** input accept 형식 ('.pdf,.xlsx,image/*') — 확장자/MIME 검사에도 사용 */
  accept?: string;
  /** 최대 첨부 개수 */
  maxCount?: number;
  /** 이미 첨부된 파일(수정 화면) */
  initial?: UploadedFile[];
  /** 완료 파일 목록이 바뀔 때 */
  onChange?: (files: UploadedFile[]) => void;
}

let uidSeq = 0;
const nextUid = () => `att-${Date.now().toString(36)}-${++uidSeq}`;

/** accept 문자열 검사 (빈 값이면 통과) */
export const matchAccept = (file: { name: string; type?: string }, accept?: string): boolean => {
  const rules = (accept ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (rules.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = (file.type ?? '').toLowerCase();
  return rules.some((r) => (r.startsWith('.') ? name.endsWith(r) : r.endsWith('/*') ? type.startsWith(r.slice(0, -1)) : type === r));
};

const fromUploaded = (f: UploadedFile): AttachItem => ({ uid: nextUid(), name: f.fileName, size: f.size, status: 'done', progress: 100, fileId: f.fileId });

/**
 * 첨부파일 업로드 상태 관리 — 크기·형식·개수 검사(거부 시 메시지) → 업로드(진행률) → 완료/오류.
 * 삭제 API 호출은 화면(FileAttachList)이 하고 여기서는 목록에서만 뺀다.
 */
export const useFileUpload = ({ upload, maxSizeMb = 10, accept, maxCount, initial, onChange }: UseFileUploadOptions) => {
  const { message } = useAppMessage();
  const [items, setItems] = useState<AttachItem[]>(() => (initial ?? []).map(fromUploaded));
  const countRef = useRef(items.length);

  /** 거부 사유(없으면 null) */
  const validate = (file: File): string | null => {
    if (!matchAccept(file, accept)) return VMSG.fileType(file.name);
    if (file.size > maxSizeMb * 1024 * 1024) return VMSG.fileSize(file.name, maxSizeMb);
    if (maxCount !== undefined && countRef.current >= maxCount) return VMSG.fileCount(maxCount);
    return null;
  };

  const patch = (uid: string, p: Partial<AttachItem>) => setItems((list) => list.map((it) => (it.uid === uid ? { ...it, ...p } : it)));

  /** 파일 1개 추가·업로드. 거부되면 null, 아니면 최종 상태 */
  const add = async (file: File): Promise<AttachItem | null> => {
    const reason = validate(file);
    if (reason) {
      message.warning(reason);
      return null;
    }
    const item: AttachItem = { uid: nextUid(), name: file.name, size: file.size, status: 'uploading', progress: 0 };
    countRef.current += 1;
    setItems((list) => [...list, item]);
    try {
      const res = await upload(file, (p) => patch(item.uid, { progress: Math.max(0, Math.min(100, Math.round(p))) }));
      const done: AttachItem = { ...item, name: res.fileName || item.name, size: res.size ?? item.size, status: 'done', progress: 100, fileId: res.fileId };
      patch(item.uid, done);
      return done;
    } catch (e) {
      const error = e instanceof Error ? e.message : '업로드에 실패했습니다.';
      patch(item.uid, { status: 'error', error });
      message.error(`[${file.name}] 업로드에 실패했습니다.`);
      return { ...item, status: 'error', error };
    }
  };

  /** 목록에서 제거 */
  const remove = (uid: string) => {
    setItems((list) => {
      const next = list.filter((it) => it.uid !== uid);
      countRef.current = next.length;
      return next;
    });
  };

  const reset = (files: UploadedFile[] = []) => {
    const next = files.map(fromUploaded);
    countRef.current = next.length;
    setItems(next);
  };

  const files: UploadedFile[] = items.filter((it) => it.status === 'done' && it.fileId).map((it) => ({ fileId: it.fileId!, fileName: it.name, size: it.size }));
  const filesKey = files.map((f) => f.fileId).join('|');

  // 완료 목록이 실제로 바뀔 때만 알림 (마운트 시 제외)
  const notify = useEffectEvent(() => onChange?.(files));
  const prevKey = useRef(filesKey);
  useEffect(() => {
    if (prevKey.current === filesKey) return;
    prevKey.current = filesKey;
    notify();
  }, [filesKey]);

  return { items, files, uploading: items.some((it) => it.status === 'uploading'), add, remove, reset, validate };
};

export type FileUploadState = ReturnType<typeof useFileUpload>;
