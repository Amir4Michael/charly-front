import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button, ConfirmDialog, DateInput, Field, Modal, SelectInput, TextInput,
} from '@/components/common';
import {
  addHistoricalTransaction, updateHistoricalTransaction, deleteHistoricalTransaction,
} from '@/services/historicalTransactionsService';
import { formatDateAr, formatMoney, todayISO } from '@/utils/reportUtils';

const emptyForm = () => ({ date: todayISO(), type: '', amount: '', direction: 'عليه', unitPrice: '', description: '' });

/**
 * قسم "المعاملات القديمة" — إضافة/تعديل/حذف معاملات من الدفاتر الورقية لعميل/قلاب/كسارة/مورد،
 * وعرضها ضمن كشف حساب واحد حقيقي (ledger) مع رصيد متحرك محسوب فعليًا من العمليات، وليس نصًا منفصلاً.
 *
 * directionHint: يشرح معنى "له/عليه" حسب نوع الكيان (العميل عكس القلاب في اتجاه الرصيد).
 */
export default function HistoricalTransactions({
  entityType, entityId, supplierType, historical = [], onChanged, directionHint, noBalanceNote,
}) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const openAdd = () => { setForm(emptyForm()); setEditId(null); setModal(true); };
  const openEdit = (tx) => {
    setForm({
      date: tx.date,
      type: tx.type || '',
      amount: tx.amount ?? '',
      direction: tx.direction,
      unitPrice: tx.unitPrice ?? '',
      description: tx.description || '',
    });
    setEditId(tx.id);
    setModal(true);
  };
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSave = async () => {
    if (!form.date) { toast.error('التاريخ مطلوب'); return; }
    if (!form.amount || Number(form.amount) <= 0) { toast.error('المبلغ مطلوب ويجب أن يكون أكبر من صفر'); return; }
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        date: form.date,
        type: form.type?.trim() || '',
        amount: Number(form.amount),
        direction: form.direction,
        unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined,
        description: form.description?.trim() || '',
      };
      if (editId) {
        await updateHistoricalTransaction(entityType, entityId, editId, payload, supplierType);
        toast.success('تم تحديث المعاملة القديمة بنجاح');
      } else {
        await addHistoricalTransaction(entityType, entityId, payload, supplierType);
        toast.success('تمت إضافة المعاملة القديمة بنجاح');
      }
      setModal(false);
      onChanged?.();
    } catch (err) {
      toast.error(err.message || 'تعذّر حفظ المعاملة القديمة');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteHistoricalTransaction(entityType, entityId, confirmId, supplierType);
      setConfirmId(null);
      toast.success('تم حذف المعاملة القديمة');
      onChanged?.();
    } catch (err) {
      toast.error(err.message || 'تعذّر حذف المعاملة القديمة');
    }
  };

  return (
    <section className="mb-6 no-print">
      <div className="mb-3 flex items-center justify-between border-b border-border pb-1">
        <h3 className="text-sm font-semibold">المعاملات القديمة (من الدفاتر الورقية)</h3>
        <Button onClick={openAdd} className="h-9 px-3 text-xs">
          <Plus className="h-4 w-4" /> إضافة معاملة قديمة
        </Button>
      </div>

      {noBalanceNote && <p className="mb-2 text-xs text-muted-foreground">{noBalanceNote}</p>}

      {!historical.length ? (
        <p className="text-sm text-muted-foreground">لا توجد معاملات قديمة مُدخلة بعد.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="bg-secondary/70">
                {['التاريخ', 'النوع', 'الوصف', 'المبلغ', 'له/عليه', ''].map((h) => (
                  <th key={h} className="border border-border px-2 py-2 text-right text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {historical.map((tx) => (
                <tr key={tx.id} className="hover:bg-secondary/30">
                  <td className="border border-border px-2 py-2">{formatDateAr(tx.date)}</td>
                  <td className="border border-border px-2 py-2">{tx.type || '—'}</td>
                  <td className="border border-border px-2 py-2">{tx.description || '—'}</td>
                  <td className="border border-border px-2 py-2 font-semibold">{formatMoney(tx.amount)}</td>
                  <td className="border border-border px-2 py-2">{tx.direction}</td>
                  <td className="border border-border px-2 py-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(tx)} className="rounded p-1.5 hover:bg-secondary" title="تعديل">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setConfirmId(tx.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10" title="حذف">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editId ? 'تعديل معاملة قديمة' : 'إضافة معاملة قديمة'}
        footer={
          <>
            <Button onClick={handleSave} loading={saving}>{editId ? 'حفظ التعديلات' : 'إضافة'}</Button>
            <Button variant="secondary" onClick={() => setModal(false)} disabled={saving}>إلغاء</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="التاريخ *">
              <DateInput value={form.date} onChange={(e) => set({ date: e.target.value })} />
            </Field>
            <Field label="المبلغ *">
              <TextInput type="number" value={form.amount} onChange={(e) => set({ amount: e.target.value })} placeholder="0" />
            </Field>
          </div>
          <Field label="نوع العملية">
            <TextInput value={form.type} onChange={(e) => set({ type: e.target.value })} placeholder="مثال: بيع، دفعة، رصيد افتتاحي..." />
          </Field>
          <Field label="له أم عليه؟ *" hint={directionHint}>
            <SelectInput options={['له', 'عليه']} value={form.direction} onChange={(e) => set({ direction: e.target.value })} placeholder="اختر..." />
          </Field>
          <Field label="السعر وقت العملية (اختياري)">
            <TextInput type="number" value={form.unitPrice} onChange={(e) => set({ unitPrice: e.target.value })} placeholder="اختياري" />
          </Field>
          <Field label="ملاحظات / وصف">
            <TextInput value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="اختياري" />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="حذف معاملة قديمة"
        message="هل أنت متأكد من حذف هذه المعاملة؟ سيتم تحديث الرصيد وكشف الحساب فورًا."
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </section>
  );
}
