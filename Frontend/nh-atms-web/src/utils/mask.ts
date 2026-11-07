/**
 * 개인정보 마스킹 표시 유틸.
 * 서버가 마스킹한 값을 그대로 보여주는 것이 원칙(CC-06). 여기 함수는 목/표시 보조용.
 */
export const maskAccount = (v?: string | null): string => {
  if (!v) return '-';
  const s = String(v);
  if (s.length <= 6) return s.replace(/.(?=.{2})/g, '*');
  return `${s.slice(0, 3)}-****-${s.slice(-4)}`;
};

export const maskCard = (v?: string | null): string => {
  if (!v) return '-';
  const s = String(v).replace(/\D/g, '');
  if (s.length < 12) return '****';
  return `${s.slice(0, 4)}-****-****-${s.slice(-4)}`;
};

export const maskName = (v?: string | null): string => {
  if (!v) return '-';
  if (v.length <= 1) return v;
  if (v.length === 2) return `${v[0]}*`;
  return `${v[0]}${'*'.repeat(v.length - 2)}${v[v.length - 1]}`;
};

export const maskPhone = (v?: string | null): string => {
  if (!v) return '-';
  return String(v).replace(/(\d{2,3})-?(\d{3,4})-?(\d{4})/, (_m, a, _b, c) => `${a}-****-${c}`);
};
