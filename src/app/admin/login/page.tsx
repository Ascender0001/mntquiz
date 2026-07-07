'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, PageShell, TextField } from '@/components/ui';
import { t } from '@/lib/strings';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        router.replace('/admin');
        router.refresh();
      } else {
        setError(t('admin.wrongPassword'));
      }
    } catch {
      setError(t('common.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <Card>
        <h1 className="text-2xl font-bold text-brand-800">{t('admin.loginTitle')}</h1>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <TextField
            label={t('admin.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error ?? undefined}
            autoComplete="current-password"
            autoFocus
          />
          <Button type="submit" disabled={loading}>
            {loading ? t('common.loading') : t('admin.signIn')}
          </Button>
        </form>
      </Card>
    </PageShell>
  );
}
