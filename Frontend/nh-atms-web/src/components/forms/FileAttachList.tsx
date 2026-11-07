import { useState } from 'react';
import { Button, Popconfirm, Progress, Tooltip, Upload } from 'antd';
import type { UploadProps } from 'antd';
import { DeleteOutlined, DownloadOutlined, ExclamationCircleOutlined, PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import { useFileUpload, type AttachItem, type UseFileUploadOptions } from '@/hooks/useFileUpload';
import { fmtBytes } from '@/utils/format';
import { CMSG } from '@/config/messages';

export interface FileAttachListProps extends UseFileUploadOptions {
  /** 다운로드 (없으면 버튼 숨김) */
  download?: (fileId: string, fileName: string) => void | Promise<void>;
  /** 서버 파일 삭제 (없으면 목록에서만 뺀다) */
  remove?: (fileId: string) => void | Promise<void>;
  /** 보기 전용: 업로드·삭제 숨김 */
  readOnly?: boolean;
  disabled?: boolean;
  /** 업로드 버튼 문구 */
  buttonText?: string;
}

/**
 * 첨부파일 목록 — antd Upload(customRequest → useFileUpload) + 진행률·다운로드·삭제.
 * 크기/형식/개수 초과는 업로드 전에 메시지로 거부한다.
 */
export const FileAttachList = ({ download, remove, readOnly, disabled, buttonText = '파일 첨부', ...options }: FileAttachListProps) => {
  const up = useFileUpload(options);
  const [busy, setBusy] = useState<string | null>(null);

  const customRequest: UploadProps['customRequest'] = ({ file, onSuccess, onError }) => {
    void up.add(file as File).then((r) => {
      if (r?.status === 'done') onSuccess?.(r);
      else onError?.(new Error(r?.error ?? '거부된 파일'));
    });
  };

  const onDelete = async (it: AttachItem) => {
    if (it.fileId && it.status === 'done' && remove) {
      setBusy(it.uid);
      try {
        await remove(it.fileId);
      } catch {
        return; // 실패 메시지는 전역 오류 처리(AppError)에 맡긴다
      } finally {
        setBusy(null);
      }
    }
    up.remove(it.uid);
  };

  const hint = [options.accept ? `형식 ${options.accept}` : null, `파일당 ${options.maxSizeMb ?? 10}MB 이하`, options.maxCount ? `최대 ${options.maxCount}개` : null].filter(Boolean).join(' · ');

  return (
    <div className="file-attach-list">
      {!readOnly && (
        <div className="flex" style={{ marginBottom: 6 }}>
          <Upload customRequest={customRequest} showUploadList={false} accept={options.accept} multiple={options.maxCount !== 1} disabled={disabled}>
            <Button icon={<UploadOutlined />} disabled={disabled}>
              {buttonText}
            </Button>
          </Upload>
          <span className="muted" style={{ fontSize: 12 }}>
            {hint}
          </span>
        </div>
      )}
      {up.items.length === 0 ? (
        <div className="muted" style={{ fontSize: 12, padding: '4px 2px' }}>
          첨부된 파일이 없습니다.
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, border: '1px solid var(--border-light)', borderRadius: 'var(--radius)' }}>
          {up.items.map((it, i) => (
            <li key={it.uid} data-status={it.status} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderTop: i ? '1px solid var(--border-light)' : undefined }}>
              {it.status === 'error' ? <ExclamationCircleOutlined style={{ color: 'var(--danger)' }} /> : <PaperClipOutlined className="muted" />}
              <span className="ellipsis" style={{ flex: 1, minWidth: 0, color: it.status === 'error' ? 'var(--danger)' : undefined }} title={it.error ?? it.name}>
                {it.name}
              </span>
              {it.status === 'uploading' ? (
                <Progress percent={it.progress} size="small" style={{ width: 120, margin: 0 }} />
              ) : (
                <span className="muted num" style={{ fontSize: 12, minWidth: 64 }}>
                  {it.status === 'error' ? '실패' : fmtBytes(it.size)}
                </span>
              )}
              {download && it.status === 'done' && it.fileId && (
                <Tooltip title="다운로드">
                  <Button size="small" type="text" icon={<DownloadOutlined />} aria-label={`${it.name} 다운로드`} onClick={() => void download(it.fileId!, it.name)} />
                </Tooltip>
              )}
              {!readOnly && it.status !== 'uploading' && (
                <Popconfirm title={CMSG.deleteTarget('첨부파일')} okText="삭제" cancelText="취소" onConfirm={() => onDelete(it)} disabled={disabled}>
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} loading={busy === it.uid} aria-label={`${it.name} 삭제`} disabled={disabled} />
                </Popconfirm>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
