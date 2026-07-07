'use client';

import { useEffect, useState } from 'react';
import { Button, TextField } from '@/components/ui';
import { Hint, PageHeading, useToast } from '@/components/admin';
import { MapIcon, MapPinIcon } from '@/components/icons';
import { t } from '@/lib/strings';

type Config = {
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  passThreshold: number;
  questionsPerQuiz: number;
};

export default function ConfigPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const { show, node } = useToast();

  useEffect(() => {
    fetch('/api/admin/config')
      .then((r) => r.json())
      .then((data) => data.config && setConfig(data.config))
      .catch(() => {});
  }, []);

  if (!config) {
    return <p className="text-slate-400">{t('common.loading')}</p>;
  }

  const set = (key: keyof Config, value: string) =>
    setConfig((c) => (c ? { ...c, [key]: value === '' ? 0 : Number(value) } : c));

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      show(t('admin.config.locationError'), 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setConfig((c) =>
          c
            ? { ...c, centerLat: pos.coords.latitude, centerLng: pos.coords.longitude }
            : c
        );
        setLocating(false);
        show(t('admin.config.locationSet'));
      },
      () => {
        setLocating(false);
        show(t('admin.config.locationError'), 'error');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centerLat: Number(config.centerLat),
          centerLng: Number(config.centerLng),
          radiusMeters: Math.round(Number(config.radiusMeters)),
          passThreshold: Math.round(Number(config.passThreshold)),
          questionsPerQuiz: Math.round(Number(config.questionsPerQuiz))
        })
      });
      show(
        res.ok ? t('admin.config.saved') : t('admin.config.invalid'),
        res.ok ? 'success' : 'error'
      );
    } catch {
      show(t('common.genericError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const mapUrl = `https://www.openstreetmap.org/?mlat=${config.centerLat}&mlon=${config.centerLng}#map=15/${config.centerLat}/${config.centerLng}`;

  return (
    <div className="max-w-xl">
      <PageHeading title={t('admin.config.title')} description={t('admin.config.description')} />
      {node}
      <form className="space-y-6" onSubmit={save}>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {t('admin.config.geofence')}
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="inline-flex items-center gap-2 rounded-xl border border-brand-600 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:opacity-50"
            >
              <MapPinIcon className="h-4 w-4" />
              {locating ? t('admin.config.locating') : t('admin.config.useLocation')}
            </button>
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <MapIcon className="h-4 w-4" />
              {t('admin.config.previewMap')}
            </a>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <TextField
                label={t('admin.config.centerLat')}
                type="number"
                step="any"
                inputMode="decimal"
                value={String(config.centerLat)}
                onChange={(e) => set('centerLat', e.target.value)}
              />
            </div>
            <div>
              <TextField
                label={t('admin.config.centerLng')}
                type="number"
                step="any"
                inputMode="decimal"
                value={String(config.centerLng)}
                onChange={(e) => set('centerLng', e.target.value)}
              />
            </div>
          </div>
          <Hint>{t('admin.config.centerHint')}</Hint>

          <div className="mt-4">
            <TextField
              label={t('admin.config.radiusMeters')}
              type="number"
              inputMode="numeric"
              value={String(config.radiusMeters)}
              onChange={(e) => set('radiusMeters', e.target.value)}
            />
            <Hint>{t('admin.config.radiusHint')}</Hint>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {t('admin.config.scoring')}
          </h2>
          <div className="mt-4">
            <TextField
              label={t('admin.config.passThreshold')}
              type="number"
              inputMode="numeric"
              value={String(config.passThreshold)}
              onChange={(e) => set('passThreshold', e.target.value)}
            />
            <Hint>{t('admin.config.passThresholdHint')}</Hint>
          </div>
          <div className="mt-4">
            <TextField
              label={t('admin.config.questionsPerQuiz')}
              type="number"
              inputMode="numeric"
              value={String(config.questionsPerQuiz)}
              onChange={(e) => set('questionsPerQuiz', e.target.value)}
            />
            <Hint>{t('admin.config.questionsPerQuizHint')}</Hint>
          </div>
        </section>

        <div className="w-full sm:w-48">
          <Button type="submit" disabled={saving}>
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
