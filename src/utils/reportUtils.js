// دوال مساعدة للتقارير والتنسيق — يُستبدل لاحقاً بمنطق الـBackend

const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

/** يوم اليوم بصيغة ISO (YYYY-MM-DD) */
export const todayISO = () => new Date().toISOString().slice(0, 10);

/** توليد ID فريد */
export const newId = (prefix = 'id') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/** تنسيق تاريخ عربي من صيغة ISO */
export const formatDateAr = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${d} ${MONTHS_AR[m - 1]} ${y}`;
  } catch {
    return dateStr;
  }
};

/** تنسيق تاريخ مع اليوم */
export const formatDateWithDay = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    const dayName = DAYS_AR[date.getDay()];
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${dayName}، ${d} ${MONTHS_AR[m - 1]} ${y}`;
  } catch {
    return dateStr;
  }
};

/** تنسيق مبلغ مالي بالجنيه المصري */
export const formatMoney = (amount) => {
  const n = Number(amount);
  if (isNaN(n)) return '—';
  return `${n.toLocaleString('ar-EG')} ج.م`;
};

/** تنسيق رقم عربي */
export const formatNumberAr = (num) => {
  if (num === '' || num === null || num === undefined) return '—';
  const n = Number(num);
  if (isNaN(n)) return '—';
  return n.toLocaleString('ar-EG');
};

/** طول الوردية الأساسية بالساعات — كل حسابات عدد الورديات في النظام تعتمد على هذا الثابت */
export const SHIFT_LENGTH_HOURS = 8;

/** يحسب عدد الورديات من عدد ساعات التشغيل: 8 ساعات = 1 وردية (4 = 0.5، 12 = 1.5، 16 = 2 ...) */
export const hoursToShifts = (hours) => {
  const n = Number(hours) || 0;
  if (n <= 0) return 0;
  // نقرّب لأقرب 0.5 وردية لتفادي فروق التقريب العشرية (مثال: 11.98 ساعة يجب ألا تُحسب كـ1.4975)
  return Math.round((n / SHIFT_LENGTH_HOURS) * 2) / 2;
};

/** حساب الإجماليات من تقرير يومي */
export const reportTotals = (report) => {
  if (!report) {
    return {
      sales: 0, remaining: 0, loadedWeight: 0, expenses: 0, hours: 0, rawWeight: 0,
      shiftsCount: 0, tippersWeight: 0, net: 0, actualHours: 0, stoppedHours: 0,
    };
  }

  const loading = report.loading || [];
  const production = report.production || [];
  const expenses = report.expenses || [];
  const tippers = report.tippers || [];

  const sales = loading.reduce((s, l) => s + (Number(l.weight) || 0) * (Number(l.price) || 0), 0);
  const remaining = loading
    .filter((l) => l.payment === 'آجل')
    .reduce((s, l) => s + (Number(l.remaining) || 0), 0);
  const loadedWeight = loading.reduce((s, l) => s + (Number(l.weight) || 0), 0);
  const expensesTotal = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const productionHours = production.reduce((s, p) => s + (Number(p.hours) || 0), 0);
  const rawWeight = Number(report.raw?.weight) || 0;
  const tippersWeight = tippers.reduce((s, t) => s + (Number(t.weight) || 0), 0);
  const tippersTotal = tippers.reduce((s, t) => s + (Number(t.total) || 0), 0);

  // ساعات التشغيل الفعلية (من فترات بداية/نهاية التشغيل المسجّلة)
  const operatingHours = report.operatingHours || [];
  const actualHours = operatingHours.reduce((s, h) => s + (Number(h.runHours) || 0), 0);
  const stoppedHours = operatingHours.reduce((s, h) => s + (Number(h.stopHours) || 0), 0);

  // إجمالي ساعات التشغيل المُعتمد لحساب عدد الورديات: نُفضّل ساعات التشغيل الفعلية
  // المسجّلة (operatingHours)، وإن لم تكن موجودة نستخدم ساعات الإنتاج/التعبئة كبديل.
  const hours = actualHours || productionHours;
  // عدد الورديات = ساعات التشغيل ÷ 8 (الوردية الأساسية = 8 ساعات ثابتة)
  const shiftsCount = hoursToShifts(hours);

  return {
    sales,
    remaining,
    loadedWeight,
    expenses: expensesTotal,
    hours,
    actualHours,
    stoppedHours,
    rawWeight,
    shiftsCount,
    tippersWeight,
    tippersTotal,
    net: sales - expensesTotal,
  };
};

/** حساب إحصائيات عميل من جميع التقارير */
export const computeCustomerStats = (customerId, reports) => {
  const sales = [];
  for (const report of reports) {
    for (const load of report.loading || []) {
      if (load.customerId === customerId) {
        sales.push({ ...load, date: report.date, reportId: report.id });
      }
    }
  }
  const totalSales = sales.reduce((s, l) => s + (Number(l.weight) || 0) * (Number(l.price) || 0), 0);
  const cashSales = sales
    .filter((l) => l.payment === 'نقدي')
    .reduce((s, l) => s + (Number(l.weight) || 0) * (Number(l.price) || 0), 0);
  const creditPaid = sales
    .filter((l) => l.payment === 'آجل')
    .reduce((s, l) => s + (Number(l.paid) || 0), 0);
  const totalRemaining = sales
    .filter((l) => l.payment === 'آجل')
    .reduce((s, l) => s + (Number(l.remaining) || 0), 0);
  return {
    sales,
    totalSales,
    totalPaid: cashSales + creditPaid,
    totalRemaining,
  };
};

/** حساب إحصائيات كسارة من جميع التقارير */
export const computeQuarryStats = (quarryId, reports) => {
  const deliveries = [];
  for (const report of reports) {
    if (report.raw?.quarryId === quarryId) {
      deliveries.push({
        date: report.date,
        material: report.raw.type,
        weight: report.raw.weight,
        unit: report.raw.unit || 'طن',
        trucks: (report.tippers || []).map((t) => t.name || t.truckName),
        reportId: report.id,
      });
    }
  }
  const totalWeight = deliveries.reduce((s, d) => s + (Number(d.weight) || 0), 0);
  return { deliveries, totalWeight };
};

/** حساب إحصائيات قلاب من جميع التقارير */
export const computeTruckStats = (truckId, reports) => {
  const trips = [];
  for (const report of reports) {
    for (const tipper of report.tippers || []) {
      if (tipper.truckId === truckId) {
        trips.push({
          ...tipper,
          date: report.date,
          material: report.raw?.type,
          quarry: report.raw?.crusher,
          quarryId: report.raw?.quarryId,
          reportId: report.id,
        });
      }
    }
  }
  const totalWeight = trips.reduce((s, t) => s + (Number(t.weight) || 0), 0);
  const totalDue = trips.reduce((s, t) => s + (Number(t.total) || 0), 0);
  const totalPaid = trips.reduce((s, t) => s + (Number(t.paid) || 0), 0);
  const totalRemaining = trips.reduce((s, t) => s + (Number(t.remaining) || 0), 0);
  return { trips, totalWeight, totalDue, totalPaid, totalRemaining };
};

/** حساب إحصائيات عامل من جميع التقارير */
export const computeWorkerStats = (workerId, reports) => {
  const workDays = [];
  for (const report of reports) {
    for (const w of report.workers || []) {
      if (typeof w === 'object' && w.workerId === workerId) {
        workDays.push({ ...w, date: report.date, shift: (report.shifts || []).join('، '), reportId: report.id });
      }
    }
  }
  const totalDays = workDays.length;
  const totalHours = workDays.reduce((s, w) => s + (Number(w.hours) || 0), 0);
  const totalDue = workDays.reduce((s, w) => s + (Number(w.dailyAmount) || 0), 0);
  const totalPaid = workDays.reduce((s, w) => s + (Number(w.paid) || 0), 0);
  return { workDays, totalDays, totalHours, totalDue, totalPaid, totalRemaining: totalDue - totalPaid };
};

/** الحصول على اسم الشهر العربي */
export const getMonthName = (monthIndex) => MONTHS_AR[monthIndex] || '';

/** تصفية التقارير بالفترة */
export const filterReportsByPeriod = (reports, from, to) => {
  return reports.filter((r) => {
    const matchFrom = !from || r.date >= from;
    const matchTo = !to || r.date <= to;
    return matchFrom && matchTo;
  });
};