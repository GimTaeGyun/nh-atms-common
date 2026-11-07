import { isValidElement, type ReactNode } from 'react';
import { Form, Input, InputNumber } from 'antd';
import type { Rule } from 'antd/es/form';
import type { NamePath } from 'antd/es/form/interface';

export interface FormItemOpts {
  /** 체크박스 단일 등: 'checked' */
  valuePropName?: string;
  /** 다른 칸을 보는 규칙(afterField·gteField)일 때 그 칸 이름 — 상대 칸이 바뀌면 다시 검사 */
  dependencies?: NamePath[];
  /**
   * 오류 글씨 없이 컨트롤만(antd noStyle). Space.Compact 처럼 칸 여러 개를 붙여 놓는 자리에서만 쓴다.
   * 이때 오류 글씨는 바깥을 `formGroup(...)` 으로 감싸야 보인다.
   */
  inline?: boolean;
  /** 검사 시점을 직접 정할 때만. 보통은 비워 두면 `triggerOf` 가 칸 종류로 고른다 */
  validateTrigger?: 'onBlur' | 'onChange';
}

/** 글자를 쳐서 넣는 antd 칸 — 이 칸들만 '칸 벗어날 때' 검사한다 */
const TYPING_CONTROLS: ReadonlySet<unknown> = new Set([Input, Input.TextArea, Input.Password, Input.Search, InputNumber]);

/**
 * 칸 종류별 검사 시점 (02-dev-guide §4.3). 저장(submit·validateFields)은 어느 쪽이든 전체 검사.
 *  - 글자 입력 칸(Input·TextArea·Password·Search·InputNumber): 'onBlur' — 입력 도중 성급한 검사를 막는다.
 *  - 그 밖(Select·DatePicker·Checkbox·사무소검색·개인번호·코너/기번 선택 등): 'onChange' — 고르는 순간이 입력 완료다.
 *    자체 부품(OfficeSelector 등)은 onBlur 를 antd 에 넘기지 않아 'onBlur' 로 두면 고른 뒤에도 오류 글씨가 남는다(2026-11-03 확인).
 */
export const triggerOf = (node: ReactNode): 'onBlur' | 'onChange' => (isValidElement(node) && TYPING_CONTROLS.has(node.type) ? 'onBlur' : 'onChange');

/**
 * 폼 칸 한 개 — DetailGrid 의 값 칸(`value`)에 넣는 표준 래퍼(02-dev-guide §4.3).
 * antd `noStyle` 은 빨간 테두리만 생기고 오류 글씨가 안 보이므로, 기본은 여백 0 + 오류 글씨 표시로 둔다.
 * 검사 시점: 글자 칸은 벗어날 때, 고르는 칸은 고르는 순간, 그리고 저장할 때 전체(triggerOf).
 *
 *   { label: '기번', required: true, value: formItem('termId', <Input />, RULES.termId) }
 */
export const formItem = (name: NamePath, node: ReactNode, rules?: Rule[], opts: FormItemOpts = {}): ReactNode => (
  <Form.Item
    name={name}
    rules={rules}
    valuePropName={opts.valuePropName}
    dependencies={opts.dependencies}
    validateTrigger={opts.validateTrigger ?? triggerOf(node)}
    noStyle={opts.inline || undefined}
    className={opts.inline ? undefined : 'form-cell'}
  >
    {node}
  </Form.Item>
);

/** `inline` 칸 여러 개를 한 묶음으로 — 안쪽 칸들의 오류 글씨를 묶음 아래에 모아 보여준다 */
export const formGroup = (node: ReactNode): ReactNode => <Form.Item className="form-cell">{node}</Form.Item>;
