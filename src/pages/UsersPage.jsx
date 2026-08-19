import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, ShieldCheck, Eye, Trash2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import {
  Badge, Button, ConfirmDialog, DataTable, EmptyState, Field, Modal, PageHeader,
  SectionCard, SelectInput, TextInput,
} from '@/components/common';
import { ROLES } from '@/services/authService';
import { deleteUser, listUsers, saveUser, toggleUserStatus } from '@/services/usersService';
import { useAuth } from '@/hooks/useAuth';
import { formatDateAr } from '@/utils/reportUtils';

const emptyForm = () => ({ name: '', username: '', password: '', role: 'viewer', phone: '', active: true });

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [confirmId, setConfirmId] = useState(null);
  const { canManage } = useAuth();

  const load = () => listUsers().then((list) => { setUsers(list); setLoading(false); });
  useEffect(() => { load(); }, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const openAdd = () => { setForm(emptyForm()); setModal(true); };
  const openEdit = (u) => { setForm({ ...u, password: '' }); setModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('يجب إدخال اسم المستخدم'); return; }
    if (!form.id && !form.username.trim()) { toast.error('يجب إدخال اسم الدخول (username)'); return; }
    try {
      // لا نرسل username عند التعديل (غير قابل للتغيير)، ولا نرسل password فارغًا (يعني عدم تغييره)
      const payload = { ...form };
      if (form.id) delete payload.username;
      if (!payload.password) delete payload.password;
      await saveUser(payload);
      await load();
      setModal(false);
      toast.success('تم حفظ المستخدم');
    } catch (err) {
      toast.error(err.message || 'تعذّر حفظ المستخدم');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(confirmId);
      await load();
      setConfirmId(null);
      toast.success('تم حذف المستخدم');
    } catch (err) {
      toast.error(err.message || 'تعذّر حذف المستخدم');
    }
  };

  const handleToggle = async (id) => {
    try {
      const updated = await toggleUserStatus(id);
      setUsers(updated);
      toast.success('تم تحديث حالة المستخدم');
    } catch (err) {
      toast.error(err.message || 'تعذّر تحديث حالة المستخدم');
    }
  };

  const columns = [
    { key: 'name', header: 'الاسم', render: (u) => <span className="font-medium">{u.name}</span> },
    {
      key: 'role', header: 'الصلاحية',
      render: (u) => (
        <Badge tone={u.role === 'admin' ? 'primary' : 'secondary'}>
          {u.role === 'admin' ? <ShieldCheck className="ml-1 h-3 w-3" /> : <Eye className="ml-1 h-3 w-3" />}
          {ROLES[u.role]?.label || u.role}
        </Badge>
      ),
    },
    { key: 'phone', header: 'الهاتف', render: (u) => u.phone || '—' },
    { key: 'lastLogin', header: 'آخر دخول', render: (u) => formatDateAr(u.lastLogin) },
    {
      key: 'active', header: 'الحالة',
      render: (u) => (
        <button
          disabled={!canManage}
          onClick={() => handleToggle(u.id)}
          className={u.active ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700' : 'rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground'}
        >
          {u.active ? 'نشط' : 'موقوف'}
        </button>
      ),
    },
    ...(canManage ? [{
      key: 'actions', header: 'الإجراءات',
      render: (u) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(u)} className="rounded px-2 py-1 text-xs text-primary hover:bg-accent">تعديل</button>
          <button onClick={() => setConfirmId(u.id)} className="rounded p-2 text-destructive hover:bg-destructive/10" title="حذف">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    }] : []),
  ];

  return (
    <>
      <Helmet>
        <title>المستخدمون والصلاحيات — نظام إدارة مصنع كربونات الكالسيوم</title>
        <meta name="description" content="إدارة مستخدمي نظام مصنع كربونات الكالسيوم وصلاحياتهم بين المدير والمشاهد." />
      </Helmet>

      <PageHeader
        title="المستخدمون والصلاحيات"
        subtitle="إدارة حسابات الدخول وتحديد صلاحية كل مستخدم"
        breadcrumb={[{ label: 'الرئيسية', to: '/' }, { label: 'الإدارة' }, { label: 'المستخدمون والصلاحيات' }]}
        actions={canManage && <Button onClick={openAdd}><Plus className="h-4 w-4" /> إضافة مستخدم</Button>}
      />

      <SectionCard title="قائمة المستخدمين" description="مدير: صلاحية كاملة (إضافة/تعديل/حذف). مشاهد: عرض فقط بدون تعديل.">
        {loading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">جاري التحميل...</p>
        ) : !users.length ? (
          <EmptyState title="لا يوجد مستخدمون" />
        ) : (
          <DataTable columns={columns} rows={users} />
        )}
      </SectionCard>

      <SectionCard
        title="إدارة الأجهزة"
        description="تجهيز واجهي فقط لإدارة الأجهزة المسموح لها بالدخول — سيتم تفعيل القفل الفعلي عند ربط النظام بالخادم"
        className="mt-6"
      >
        <div className="flex items-start gap-3 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
          <Smartphone className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            سيتم لاحقًا ربط كل مستخدم بجهاز أو أكثر مصرّح له بالدخول، ومنع الدخول من أي جهاز غير مسجّل. هذه الميزة تحتاج إلى
            خادم (Backend) لتفعيل القفل الفعلي، والواجهة هنا جاهزة لإضافتها دون تعديل في التصميم.
          </p>
        </div>
      </SectionCard>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={form.id ? 'تعديل مستخدم' : 'إضافة مستخدم'}
        footer={
          <>
            <Button onClick={handleSave}>حفظ</Button>
            <Button variant="secondary" onClick={() => setModal(false)}>إلغاء</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="الاسم">
            <TextInput value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="اسم المستخدم" />
          </Field>
          {form.id ? (
            <Field label="اسم الدخول (username)" hint="لا يمكن تغييره بعد الإنشاء">
              <TextInput value={form.username} disabled className="bg-secondary" />
            </Field>
          ) : (
            <Field label="اسم الدخول (username)" hint="حروف إنجليزية وأرقام فقط، 3 أحرف على الأقل">
              <TextInput
                value={form.username}
                onChange={(e) => set({ username: e.target.value })}
                placeholder="مثال: ahmed.m"
                dir="ltr"
              />
            </Field>
          )}
          <Field
            label={form.id ? 'كلمة مرور جديدة (اختياري)' : 'كلمة المرور (اختياري)'}
            hint={form.id ? 'اتركه فارغًا للإبقاء على كلمة المرور الحالية' : 'اتركه فارغًا لاستخدام كلمة المرور الافتراضية للنظام'}
          >
            <TextInput
              type="password"
              value={form.password}
              onChange={(e) => set({ password: e.target.value })}
              placeholder="6 أحرف على الأقل"
              dir="ltr"
            />
          </Field>
          <Field label="رقم الهاتف">
            <TextInput value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="اختياري" />
          </Field>
          <Field label="الصلاحية">
            <SelectInput
              options={['مدير', 'مشاهدة فقط']}
              value={form.role === 'admin' ? 'مدير' : 'مشاهدة فقط'}
              onChange={(e) => set({ role: e.target.value === 'مدير' ? 'admin' : 'viewer' })}
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="حذف المستخدم"
        message="هل أنت متأكد من حذف هذا المستخدم؟"
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}
