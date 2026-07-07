import messages from '../../messages/hu.json';

/**
 * Minimal Hungarian string lookup with `{param}` interpolation.
 * Usage: t('quiz.progress', { current: 1, total: 5 })
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const value = key
    .split('.')
    .reduce<unknown>(
      (acc, k) =>
        acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[k] : undefined,
      messages
    );

  if (typeof value !== 'string') return key;

  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (_, name) =>
    name in params ? String(params[name]) : `{${name}}`
  );
}

export { messages };
