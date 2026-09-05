export const money = (value) => {
  const n = Number(value ?? 0);
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const dateStr = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const apiErrorMessage = (err, fallback = 'Something went wrong.') => {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return fallback;
};