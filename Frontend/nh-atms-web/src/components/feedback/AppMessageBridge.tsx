import { useEffect } from 'react';
import { App } from 'antd';
import { appUi } from '@/hooks/useAppMessage';

/** antd App 컨텍스트의 message/modal/notification 을 모듈 홀더에 연결 */
export const AppMessageBridge = () => {
  const { message, modal, notification } = App.useApp();
  useEffect(() => {
    appUi.message = message;
    appUi.modal = modal;
    appUi.notification = notification;
    return () => {
      appUi.message = null;
      appUi.modal = null;
      appUi.notification = null;
    };
  }, [message, modal, notification]);
  return null;
};
