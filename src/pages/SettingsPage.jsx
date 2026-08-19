import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Field, LoadingState, PageHeader, SectionCard, TextInput } from '@/components/common';
import { getSettingsAsync, saveSettings } from '@/services/settingsService';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const { canManage } = useAuth();

  useEffect(() => {
    getSettingsAsync().then(setForm);
  }, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSettings(form);
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (err) {
      toast.error(err.message || 'تعذّر حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <LoadingState />;

  return (
    <>
      <Helmet>
        <title>الإعدادات — نظام إدارة مصنع كربونات الكالسيوم</title>
        <meta name="description" content="بيانات مصنع كربونات الكالسيوم الأساسية التي تظهر في التقارير والطباعة." />
      </Helmet>

      <PageHeader
        title="الإعدادات"
        subtitle="بيانات المصنع الأساسية التي تظهر في التقارير والطباعة"
        breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'الإدارة' }, { label: 'الإعدادات' }]}
      />

      <form onSubmit={handleSave} className="space-y-6">
        <SectionCard title="بيانات المصنع">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="اسم المصنع">
              <TextInput value={form.factoryName} onChange={(e) => set({ factoryName: e.target.value })} disabled={!canManage} />
            </Field>
            <Field label="العنوان">
              <TextInput value={form.address} onChange={(e) => set({ address: e.target.value })} disabled={!canManage} />
            </Field>
            <Field label="رقم الهاتف">
              <TextInput value={form.phone} onChange={(e) => set({ phone: e.target.value })} disabled={!canManage} />
            </Field>
            <Field label="البريد الإلكتروني">
              <TextInput type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} disabled={!canManage} placeholder="اختياري" />
            </Field>
            <Field label="الرقم الضريبي">
              <TextInput value={form.taxNumber} onChange={(e) => set({ taxNumber: e.target.value })} disabled={!canManage} placeholder="اختياري" />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="ملاحظات تظهر أسفل المستندات المطبوعة">
              <TextInput value={form.notes} onChange={(e) => set({ notes: e.target.value })} disabled={!canManage} placeholder="اختياري" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="الخامات ودرجات النعومة والعبوات" description="إدارة القوائم المستخدمة في التقرير اليومي وباقي النظام">
          <Link
            to="/materials"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm hover:bg-secondary"
          >
            <Layers className="h-4 w-4" /> فتح صفحة إدارة الخامات
          </Link>
        </SectionCard>

        {canManage && (
          <Button type="submit" loading={saving} className="px-8">
            حفظ الإعدادات
          </Button>
        )}
      </form>
    </>
  );
}
