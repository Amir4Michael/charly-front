import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Printer, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button, DateInput, Field, LoadingState, PageHeader, SelectInput } from '@/components/common';
import { getWeeklySchedule, saveWeeklySchedule } from '@/services/reportsService';
import { getMaterials } from '@/services/materialsService';
import { SHIFTS } from '@/data/mockData';
import { getSettings } from '@/services/settingsService';
import { useAuth } from '@/hooks/useAuth';
import { todayISO } from '@/utils/reportUtils';

const NO_WORK = 'بدون عمل';

/** بداية الأسبوع بالتقويم العربي (السبت أولاً)، مطابقة لترتيب WEEK_DAYS في الباك اند */
function startOfWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0=الأحد ... 6=السبت
  const diff = (day + 1) % 7; // عدد الأيام منذ آخر سبت
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

export default function WeeklySchedulePage() {
  const [data, setData] = useState(null);
  const [week, setWeek] = useState(() => startOfWeek(todayISO()));
  const [saving, setSaving] = useState(false);
  const [materials, setMaterials] = useState({ rawTypes: [], fineness: [], packagingProduction: [], packagingLoading: [] });
  const { canManage } = useAuth();
  const options = [...materials.fineness, NO_WORK];

  useEffect(() => {
    getMaterials().then(setMaterials);
  }, []);

  useEffect(() => {
    setData(null);
    getWeeklySchedule(week).then(setData);
  }, [week]);

  const updateCell = (dayIdx, shiftIdx, value) => {
    setData((d) => ({
      ...d,
      rows: d.rows.map((row, ri) =>
        ri === dayIdx ? { ...row, shifts: row.shifts.map((v, si) => (si === shiftIdx ? value : v)) } : row,
      ),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await saveWeeklySchedule({ ...data, weekStart: week });
      setData(saved);
      toast.success('تم حفظ الجدول الأسبوعي بنجاح');
    } catch (err) {
      toast.error(err.message || 'تعذّر حفظ الجدول الأسبوعي');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>الجدول الأسبوعي — نظام إدارة مصنع كربونات الكالسيوم</title>
        <meta name="description" content="جدول التشغيل الأسبوعي لورديات مصنع كربونات الكالسيوم موزع على أيام الأسبوع، قابل للتعديل والحفظ." />
      </Helmet>

      <PageHeader
        title="الجدول الأسبوعي"
        subtitle="خطة تشغيل الورديات خلال الأسبوع — يمكن التعديل والحفظ"
        breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'التشغيل' }, { label: 'الجدول الأسبوعي' }]}
        actions={<Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> طباعة</Button>}
      />

      <div className="app-card p-4 sm:p-6">
        <header className="hidden text-center print:block print:mb-4">
          <h2 className="text-xl font-bold">{getSettings().factoryName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">الجدول الأسبوعي — بداية الأسبوع {week}</p>
        </header>

        <div className="no-print mb-5 flex flex-wrap items-end gap-3">
          <Field label="بداية الأسبوع" className="sm:w-56">
            <DateInput value={week} onChange={(e) => setWeek(startOfWeek(e.target.value))} />
          </Field>
          {canManage && (
            <Button loading={saving} onClick={handleSave}>
              <Save className="h-4 w-4" /> حفظ الجدول
            </Button>
          )}
        </div>

        {!data ? (
          <LoadingState />
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-md border border-border md:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-secondary/70">
                    <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground">اليوم</th>
                    {SHIFTS.map((s) => (
                      <th key={s} className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground">
                        {s}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {data.rows.map((row, ri) => (
                    <tr key={row.day}>
                      <td className="px-3 py-3 font-medium">{row.day}</td>
                      {row.shifts.map((v, i) => (
                        <td key={`${row.day}-${i}`} className="px-3 py-3">
                          {canManage ? (
                            <SelectInput
                              options={options}
                              value={v}
                              onChange={(e) => updateCell(ri, i, e.target.value)}
                              className="h-9 w-36"
                            />
                          ) : (
                            <span
                              className={
                                v === NO_WORK || !v
                                  ? 'inline-block rounded border border-border bg-secondary px-2 py-1 text-xs text-muted-foreground'
                                  : 'inline-block rounded border border-primary/25 bg-accent px-2 py-1 text-xs font-medium text-accent-foreground'
                              }
                            >
                              {v || NO_WORK}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {data.rows.map((row, ri) => (
                <div key={row.day} className="rounded-md border border-border p-3">
                  <p className="mb-2 text-sm font-semibold">{row.day}</p>
                  <ul className="space-y-2 text-sm">
                    {row.shifts.map((v, i) => (
                      <li key={`${row.day}-m-${i}`} className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">{SHIFTS[i]}</span>
                        {canManage ? (
                          <SelectInput options={options} value={v} onChange={(e) => updateCell(ri, i, e.target.value)} className="h-9 w-36" />
                        ) : (
                          <span className={v === NO_WORK || !v ? 'text-muted-foreground' : 'font-medium'}>{v || NO_WORK}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
