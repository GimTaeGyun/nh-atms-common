import { App } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import type { ModalStaticFunctions } from 'antd/es/modal/confirm';
import type { NotificationInstance } from 'antd/es/notification/interface';

type Holder = { message: MessageInstance | null; modal: Omit<ModalStaticFunctions, 'warn'> | null; notification: NotificationInstance | null };
/** React 바깥(쿼리 캐시 onError 등)에서도 테마가 적용된 message 를 쓰기 위한 홀더 */
export const appUi: Holder = { message: null, modal: null, notification: null };

/** 컴포넌트 안에서는 이 훅을, 바깥에서는 appUi 를 쓴다 */
export const useAppMessage = () => App.useApp();

export const notifyError = (text: string): void => {
  if (appUi.message) appUi.message.error(text);
  else console.error(text);
};
export const notifySuccess = (text: string): void => {
  if (appUi.message) appUi.message.success(text);
};
