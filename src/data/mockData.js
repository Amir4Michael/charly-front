// بيانات تجريبية مترابطة بـ IDs — تُستبدل لاحقاً بنداءات API حقيقية

export const FACTORY_NAME = 'مصنع النيل لكربونات الكالسيوم';

// ثوابت القوائم
export const MANAGERS = ['حمادة أسيوط', 'محمد عبد الله', 'جرجس صبحي', 'أحمد فتحي', 'محمود السيد'];
export const RAW_TYPES = ['بودرة', 'مقروش', 'مخلط'];
export const WEIGHT_UNITS = ['طن', 'كيلو'];
export const SHIFTS = ['وردية 1', 'وردية 2', 'وردية 3'];
export const FINENESS = ['45M', '50M', '60M', '80M', '100M'];
export const PACKAGING_PRODUCTION = ['جامبو', 'شكارة', 'سايلو'];
export const PACKAGING_LOADING = ['سايلو', 'شكارة 25', 'شكارة 50', 'جامبو'];
export const PAYMENT_METHODS = ['نقدي', 'آجل'];
export const EXPENSE_TYPES = ['أكل', 'أجور', 'سولار', 'صيانة', 'أجور عمال', 'كهرباء', 'نقل', 'قطع غيار', 'متنوع'];
export const EXPENSE_CATEGORIES = ['وقود', 'صيانة', 'أجور', 'مرافق', 'نقل', 'إداري', 'متنوع'];
export const WEEK_DAYS = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
export const WORKER_JOBS = ['مشغل', 'ميكانيكي', 'كهربائي', 'سائق', 'عامل إنتاج', 'عامل تحميل', 'حارس'];
export const STOP_REASONS = ['انقطاع كهرباء', 'عطل ميكانيكي', 'صيانة مجدولة', 'نقص خامة', 'انتهاء الطلب', 'أسباب أخرى'];

// ——— العملاء ———
export const MOCK_CUSTOMERS = [
  {
    id: 'cust-001',
    name: 'شركة النصر للدهانات',
    phone: '01012345678',
    address: 'القاهرة — المنطقة الصناعية',
    contactPerson: 'المهندس سامر حسن',
    notes: 'عميل دائم — يطلب بشكل شهري',
  },
  {
    id: 'cust-002',
    name: 'مصنع الأمل للبلاستيك',
    phone: '01098765432',
    address: 'الإسكندرية — المنطقة الصناعية',
    contactPerson: 'أحمد مصطفى',
    notes: '',
  },
  {
    id: 'cust-003',
    name: 'شركة الدلتا للأعلاف',
    phone: '01155566677',
    address: 'المنوفية — شبين الكوم',
    contactPerson: 'سيد البدري',
    notes: 'يفضل التسليم على دفعات',
  },
  {
    id: 'cust-004',
    name: 'مصنع الحرمين للورق',
    phone: '01234567890',
    address: 'القاهرة — عين شمس',
    contactPerson: 'عمر فاروق',
    notes: '',
  },
  {
    id: 'cust-005',
    name: 'شركة المستقبل للمواسير',
    phone: '01066677788',
    address: 'الجيزة — أكتوبر',
    contactPerson: 'محمود رضا',
    notes: 'يطلب 45M فقط',
  },
];

// قائمة أسماء العملاء للاستخدام في SearchSelect
export const CUSTOMERS = MOCK_CUSTOMERS.map((c) => c.name);

// ——— الكسارات ———
export const MOCK_QUARRIES = [
  {
    id: 'quar-001',
    name: 'كسارة المنيا',
    owner: 'الحاج أحمد السيد',
    phone: '01011112222',
    address: 'المنيا — طريق الصحراء',
    notes: 'أفضل جودة مقروش',
  },
  {
    id: 'quar-002',
    name: 'كسارة بني سويف',
    owner: 'محمد عبد العزيز',
    phone: '01033334444',
    address: 'بني سويف — المنطقة الجبلية',
    notes: '',
  },
  {
    id: 'quar-003',
    name: 'كسارة سمالوط',
    owner: 'جرجس منصور',
    phone: '01055556666',
    address: 'سمالوط — المنيا',
    notes: 'متخصص في البودرة',
  },
  {
    id: 'quar-004',
    name: 'كسارة أسيوط',
    owner: 'حمدي رياض',
    phone: '01077778888',
    address: 'أسيوط — المنطقة الصناعية',
    notes: '',
  },
];

export const CRUSHERS = MOCK_QUARRIES.map((q) => q.name);

// ——— القلابات ———
export const MOCK_TRUCKS = [
  {
    id: 'trk-001',
    name: 'قلاب حمادة',
    driver: 'حمادة علي',
    phone: '01011223344',
    plateNumber: 'أ ب ج 1234',
    notes: '',
  },
  {
    id: 'trk-002',
    name: 'قلاب محمد',
    driver: 'محمد إبراهيم',
    phone: '01055443322',
    plateNumber: 'ه و ز 5678',
    notes: '',
  },
  {
    id: 'trk-003',
    name: 'قلاب جرجس',
    driver: 'جرجس عياد',
    phone: '01099887766',
    plateNumber: 'ح ط ي 9012',
    notes: '',
  },
  {
    id: 'trk-004',
    name: 'قلاب سيد',
    driver: 'سيد رمضان',
    phone: '01022334455',
    plateNumber: 'ك ل م 3456',
    notes: 'يعمل في المناطق البعيدة',
  },
  {
    id: 'trk-005',
    name: 'قلاب مصطفى',
    driver: 'مصطفى خالد',
    phone: '01088997766',
    plateNumber: 'ن س ع 7890',
    notes: '',
  },
];

export const TIPPERS = MOCK_TRUCKS.map((t) => t.name);

// ——— العمال ———
export const MOCK_WORKERS = [
  {
    id: 'wrk-001',
    name: 'محمد عبد الله',
    job: 'مشغل',
    phone: '01011234567',
    dailyRate: 350,
    notes: 'مشغل رئيسي',
  },
  {
    id: 'wrk-002',
    name: 'أحمد فتحي',
    job: 'مشغل',
    phone: '01022345678',
    dailyRate: 350,
    notes: '',
  },
  {
    id: 'wrk-003',
    name: 'سيد رمضان',
    job: 'عامل إنتاج',
    phone: '01033456789',
    dailyRate: 250,
    notes: '',
  },
  {
    id: 'wrk-004',
    name: 'جرجس صبحي',
    job: 'عامل إنتاج',
    phone: '01044567890',
    dailyRate: 250,
    notes: '',
  },
  {
    id: 'wrk-005',
    name: 'مصطفى حسين',
    job: 'عامل تحميل',
    phone: '01055678901',
    dailyRate: 220,
    notes: '',
  },
  {
    id: 'wrk-006',
    name: 'عماد كامل',
    job: 'عامل تحميل',
    phone: '01066789012',
    dailyRate: 220,
    notes: '',
  },
];

export const WORKERS = MOCK_WORKERS.map((w) => w.name);
export const OPERATORS = MOCK_WORKERS.filter((w) => w.job === 'مشغل').map((w) => w.name);

// ——— دالة مساعدة لإزاحة التواريخ ———
const today = new Date();
const dayOffset = (n) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

// ——— التقارير اليومية ———
export const MOCK_REPORTS = [
  {
    id: 'rep-1001',
    date: dayOffset(0),
    managers: ['حمادة أسيوط', 'محمد عبد الله'],
    shifts: ['وردية 1', 'وردية 2'],
    raw: {
      type: 'مقروش',
      weight: 120,
      unit: 'طن',
      quarryId: 'quar-001',
      crusher: 'كسارة المنيا',
    },
    tippers: [
      { id: 't1', name: 'قلاب حمادة', truckId: 'trk-001', weight: 45, rate: 35, total: 1575, paid: 1575, remaining: 0 },
      { id: 't2', name: 'قلاب محمد', truckId: 'trk-002', weight: 38, rate: 35, total: 1330, paid: 0, remaining: 1330 },
    ],
    operatingHours: [
      { id: 'oh1', runStart: '08:00', runEnd: '16:00', runHours: 8, stopHours: 0, stopReason: '' },
    ],
    operator: 'محمد عبد الله',
    workersCount: 4,
    workers: [
      { workerId: 'wrk-001', name: 'محمد عبد الله', hours: 8, dailyAmount: 350, paid: 350, remaining: 0 },
      { workerId: 'wrk-003', name: 'سيد رمضان', hours: 8, dailyAmount: 250, paid: 250, remaining: 0 },
      { workerId: 'wrk-004', name: 'جرجس صبحي', hours: 8, dailyAmount: 250, paid: 250, remaining: 0 },
      { workerId: 'wrk-005', name: 'مصطفى حسين', hours: 8, dailyAmount: 220, paid: 0, remaining: 220 },
    ],
    production: [
      { id: 'p1', fineness: '45M', hours: 8, packaging: 'شكارة', customerId: 'cust-001', customer: 'شركة النصر للدهانات', quantity: 100 },
      { id: 'p2', fineness: '50M', hours: 6, packaging: 'جامبو', customerId: 'cust-002', customer: 'مصنع الأمل للبلاستيك', quantity: 75 },
    ],
    loading: [
      {
        id: 'l1', fineness: '45M', weight: 30,
        customerId: 'cust-001', customer: 'شركة النصر للدهانات',
        packaging: 'شكارة 50', price: 1800,
        payment: 'نقدي', paid: 54000, remaining: 0,
      },
      {
        id: 'l2', fineness: '50M', weight: 25,
        customerId: 'cust-002', customer: 'مصنع الأمل للبلاستيك',
        packaging: 'جامبو', price: 2000,
        payment: 'آجل', paid: 30000, remaining: 20000,
      },
    ],
    expenses: [
      { id: 'e1', category: 'وقود', type: 'سولار', amount: 4500, entity: 'محطة الوقود', notes: 'تموين المولد' },
      { id: 'e2', category: 'أجور', type: 'أجور عمال', amount: 2400, entity: 'العمال', notes: '' },
    ],
  },
  {
    id: 'rep-1000',
    date: dayOffset(1),
    managers: ['جرجس صبحي'],
    shifts: ['وردية 1'],
    raw: {
      type: 'بودرة',
      weight: 80,
      unit: 'طن',
      quarryId: 'quar-002',
      crusher: 'كسارة بني سويف',
    },
    tippers: [
      { id: 't3', name: 'قلاب جرجس', truckId: 'trk-003', weight: 40, rate: 35, total: 1400, paid: 1400, remaining: 0 },
    ],
    operatingHours: [
      { id: 'oh2', runStart: '07:00', runEnd: '14:00', runHours: 7, stopHours: 0, stopReason: '' },
    ],
    operator: 'أحمد فتحي',
    workersCount: 3,
    workers: [
      { workerId: 'wrk-002', name: 'أحمد فتحي', hours: 7, dailyAmount: 350, paid: 350, remaining: 0 },
      { workerId: 'wrk-005', name: 'مصطفى حسين', hours: 7, dailyAmount: 220, paid: 220, remaining: 0 },
      { workerId: 'wrk-006', name: 'عماد كامل', hours: 7, dailyAmount: 220, paid: 0, remaining: 220 },
    ],
    production: [
      { id: 'p3', fineness: '60M', hours: 7, packaging: 'سايلو', customerId: 'cust-003', customer: 'شركة الدلتا للأعلاف', quantity: 60 },
    ],
    loading: [
      {
        id: 'l3', fineness: '60M', weight: 20,
        customerId: 'cust-003', customer: 'شركة الدلتا للأعلاف',
        packaging: 'سايلو', price: 1750,
        payment: 'نقدي', paid: 35000, remaining: 0,
      },
    ],
    expenses: [
      { id: 'e3', category: 'صيانة', type: 'صيانة', amount: 1800, entity: 'ورشة الصيانة', notes: 'تغيير سير' },
    ],
  },
  {
    id: 'rep-0999',
    date: dayOffset(2),
    managers: ['حمادة أسيوط'],
    shifts: ['وردية 1', 'وردية 2', 'وردية 3'],
    raw: {
      type: 'مقروش',
      weight: 150,
      unit: 'طن',
      quarryId: 'quar-001',
      crusher: 'كسارة المنيا',
    },
    tippers: [
      { id: 't4', name: 'قلاب حمادة', truckId: 'trk-001', weight: 50, rate: 35, total: 1750, paid: 1750, remaining: 0 },
      { id: 't5', name: 'قلاب سيد', truckId: 'trk-004', weight: 55, rate: 35, total: 1925, paid: 0, remaining: 1925 },
    ],
    operatingHours: [
      { id: 'oh3', runStart: '06:00', runEnd: '14:00', runHours: 6, stopHours: 2, stopReason: 'انقطاع كهرباء' },
      { id: 'oh4', runStart: '16:00', runEnd: '24:00', runHours: 8, stopHours: 0, stopReason: '' },
    ],
    operator: 'محمد عبد الله',
    workersCount: 5,
    workers: [
      { workerId: 'wrk-001', name: 'محمد عبد الله', hours: 16, dailyAmount: 350, paid: 350, remaining: 0 },
      { workerId: 'wrk-003', name: 'سيد رمضان', hours: 8, dailyAmount: 250, paid: 250, remaining: 0 },
      { workerId: 'wrk-004', name: 'جرجس صبحي', hours: 8, dailyAmount: 250, paid: 0, remaining: 250 },
      { workerId: 'wrk-005', name: 'مصطفى حسين', hours: 8, dailyAmount: 220, paid: 220, remaining: 0 },
      { workerId: 'wrk-006', name: 'عماد كامل', hours: 8, dailyAmount: 220, paid: 0, remaining: 220 },
    ],
    production: [
      { id: 'p4', fineness: '45M', hours: 8, packaging: 'شكارة', customerId: 'cust-001', customer: 'شركة النصر للدهانات', quantity: 120 },
      { id: 'p5', fineness: '80M', hours: 6, packaging: 'جامبو', customerId: 'cust-004', customer: 'مصنع الحرمين للورق', quantity: 80 },
    ],
    loading: [
      {
        id: 'l4', fineness: '45M', weight: 40,
        customerId: 'cust-001', customer: 'شركة النصر للدهانات',
        packaging: 'شكارة 50', price: 1800,
        payment: 'آجل', paid: 50000, remaining: 22000,
      },
      {
        id: 'l5', fineness: '80M', weight: 30,
        customerId: 'cust-004', customer: 'مصنع الحرمين للورق',
        packaging: 'جامبو', price: 2200,
        payment: 'نقدي', paid: 66000, remaining: 0,
      },
    ],
    expenses: [
      { id: 'e4', category: 'وقود', type: 'سولار', amount: 5500, entity: 'محطة الوقود', notes: '' },
      { id: 'e5', category: 'صيانة', type: 'قطع غيار', amount: 3200, entity: 'ورشة المحمودية', notes: 'بيرينج محرك' },
    ],
  },
  {
    id: 'rep-0998',
    date: dayOffset(5),
    managers: ['محمد عبد الله'],
    shifts: ['وردية 1'],
    raw: {
      type: 'مخلط',
      weight: 70,
      unit: 'طن',
      quarryId: 'quar-003',
      crusher: 'كسارة سمالوط',
    },
    tippers: [
      { id: 't6', name: 'قلاب مصطفى', truckId: 'trk-005', weight: 35, rate: 40, total: 1400, paid: 1400, remaining: 0 },
    ],
    operatingHours: [
      { id: 'oh5', runStart: '08:00', runEnd: '15:00', runHours: 7, stopHours: 0, stopReason: '' },
    ],
    operator: 'أحمد فتحي',
    workersCount: 3,
    workers: [
      { workerId: 'wrk-002', name: 'أحمد فتحي', hours: 7, dailyAmount: 350, paid: 350, remaining: 0 },
      { workerId: 'wrk-006', name: 'عماد كامل', hours: 7, dailyAmount: 220, paid: 220, remaining: 0 },
    ],
    production: [
      { id: 'p6', fineness: '100M', hours: 7, packaging: 'شكارة', customerId: 'cust-005', customer: 'شركة المستقبل للمواسير', quantity: 50 },
    ],
    loading: [
      {
        id: 'l6', fineness: '100M', weight: 18,
        customerId: 'cust-005', customer: 'شركة المستقبل للمواسير',
        packaging: 'شكارة 25', price: 2500,
        payment: 'آجل', paid: 25000, remaining: 20000,
      },
    ],
    expenses: [
      { id: 'e6', category: 'مرافق', type: 'كهرباء', amount: 1200, entity: 'الشركة القومية', notes: '' },
    ],
  },
];

// ——— الجدول الأسبوعي ———
export const MOCK_WEEKLY_SCHEDULE = {
  weekStart: dayOffset(today.getDay() === 6 ? 0 : today.getDay() + 1),
  rows: [
    { day: 'السبت', shifts: ['45M', '45M', 'بدون عمل'] },
    { day: 'الأحد', shifts: ['50M', '45M', '45M'] },
    { day: 'الإثنين', shifts: ['45M', 'بدون عمل', 'بدون عمل'] },
    { day: 'الثلاثاء', shifts: ['60M', '60M', '45M'] },
    { day: 'الأربعاء', shifts: ['45M', '50M', 'بدون عمل'] },
    { day: 'الخميس', shifts: ['80M', '45M', '45M'] },
    { day: 'الجمعة', shifts: ['بدون عمل', 'بدون عمل', 'بدون عمل'] },
  ],
};

// ——— النشاطات الأخيرة للداشبورد ———
export const MOCK_ACTIVITY = [
  { id: 'a1', type: 'استلام خامة', detail: 'استلام 45 طن مقروش من كسارة المنيا', time: '08:15' },
  { id: 'a2', type: 'تقرير تشغيل', detail: 'بدء وردية 1 — المشغل محمد عبد الله', time: '09:00' },
  { id: 'a3', type: 'عملية تعبئة', detail: 'تعبئة 45M — شكارة — شركة النصر للدهانات', time: '11:30' },
  { id: 'a4', type: 'تحميل', detail: 'تحميل 30 طن لشركة النصر للدهانات', time: '13:45' },
  { id: 'a5', type: 'مصروف', detail: 'سولار بمبلغ 4,500 ج.م', time: '15:10' },
];

// ——— الإعدادات الافتراضية ———
export const DEFAULT_SETTINGS = {
  factoryName: 'مصنع النيل لكربونات الكالسيوم',
  address: 'المنيا — مصر',
  phone: '01012345678',
  email: '',
  taxNumber: '',
  notes: '',
};

// ——— المستخدمون الافتراضيون ———
export const MOCK_USERS = [
  { id: 'usr-001', name: 'مدير المصنع', role: 'admin', phone: '01012345678', active: true, lastLogin: dayOffset(0) },
  { id: 'usr-002', name: 'المشرف الأول', role: 'viewer', phone: '01098765432', active: true, lastLogin: dayOffset(1) },
  { id: 'usr-003', name: 'محاسب المصنع', role: 'viewer', phone: '01055443322', active: false, lastLogin: dayOffset(10) },
];
