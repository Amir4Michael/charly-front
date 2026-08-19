// إعدادات واتساب — مصدر واحد لرقم واتساب المصنع حتى يسهل تغييره مستقبلاً
// (لاحقًا يمكن نقل هذا الرقم ليُقرأ من صفحة الإعدادات / الـBackend)
import { whatsappHref } from '@/lib/phone';

export const FACTORY_WHATSAPP_NUMBER = '01288814001';

/** رابط مشاركة نص عبر واتساب على رقم المصنع الافتراضي (تقارير عامة لا ترتبط بشخص محدد) */
export const factoryWhatsAppShareHref = (message = '') => whatsappHref(FACTORY_WHATSAPP_NUMBER, message);
