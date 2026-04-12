import { create } from 'zustand'

const AR = {
  // Nav
  home: 'الرئيسية', drivers: 'ملفات السائقين', documents: 'الامتثال الوثائقي',
  recruitment: 'التوظيف', terminated: 'السائقون المنتهية خدمتهم',
  analytics: 'التحليلات', settings: 'الإعدادات', logout: 'تسجيل الخروج', logged_out: 'تم تسجيل الخروج',
  // Common
  search: 'بحث', reset: 'إعادة تعيين', save: 'حفظ', cancel: 'إلغاء',
  delete: 'حذف', edit: 'تعديل', add: 'إضافة', import_csv: 'استيراد CSV',
  slicers: 'الفلاتر', filters: 'الفلاتر', print: 'طباعة التقرير',
  loading: 'جارٍ التحميل...', saving: 'جارٍ الحفظ...', deleting: 'جارٍ الحذف...',
  no_data: 'لا توجد بيانات', confirm_delete: 'تأكيد الحذف',
  // Status
  active: 'نشط', terminated_s: 'منتهي الخدمة', all: 'الكل',
  // Drivers
  drivers_title: 'ملفات السائقين', total_records: 'إجمالي السجلات',
  total: 'الإجمالي', this_page: 'هذه الصفحة',
  rta_id: 'رقم RTA', full_name: 'الاسم الكامل', nationality: 'الجنسية',
  depot: 'المستودع', contractor: 'المقاول', status: 'الحالة', id_card: 'بطاقة الهوية',
  actions: 'الإجراءات', add_driver: 'إضافة سائق', edit_driver: 'تعديل السائق',
  date_of_hire: 'تاريخ التعيين', date_of_birth: 'تاريخ الميلاد',
  license_number: 'رقم الرخصة', license_expiry: 'انتهاء الرخصة',
  passport_expiry: 'انتهاء الجواز', visa_expiry: 'انتهاء التأشيرة',
  medical_expiry: 'انتهاء الفحص الطبي', contact: 'التواصل',
  search_placeholder: 'ابحث بالاسم أو رقم RTA...',
  showing: 'عرض', of: 'من',
  // Documents
  doc_title: 'الامتثال الوثائقي', doc_sub: 'حالة انتهاء الرخصة والجواز والتأشيرة والفحص الطبي',
  license: 'رخصة القيادة', passport: 'جواز السفر', visa: 'التأشيرة', medical: 'الفحص الطبي',
  expired: 'منتهي', valid: 'ساري', critical: 'حرج', warning: 'تحذير',
  compliance_records: 'سجلات الامتثال', records: 'سجل',
  // Analytics
  analytics_title: 'التحليلات والتقارير', live_data: 'بيانات مباشرة من قاعدة البيانات',
  hire_trend: 'اتجاه التوظيف بالسنة', drivers_by_depot: 'السائقون حسب المستودع',
  top_nationalities: 'أعلى الجنسيات', by_contractor: 'حسب المقاول',
  id_card_status: 'حالة بطاقة الهوية', recruitment_status: 'حالة التوظيف',
  road_test: 'اختبار الطريق', expired_docs: 'الوثائق المنتهية حسب النوع',
  filtered_view: 'عرض مفلتر — يُظهر مجموعة فرعية',
  // Recruitment
  rec_title: 'مسار التوظيف', candidates_tracked: 'مرشح تحت المتابعة',
  on_board: 'على متن العمل', shortlisted: 'في القائمة المختصرة',
  road_test_pass: 'اجتاز اختبار الطريق', not_shortlisted: 'غير مختار',
  pipeline_flow: 'مسار التوظيف', total_applied: 'إجمالي المتقدمين',
  interview_pass: 'اجتاز المقابلة', candidate_records: 'سجلات المرشحين',
  candidates: 'مرشح', company: 'الشركة', interview: 'المقابلة',
  // Terminated
  term_title: 'السائقون المنتهية خدمتهم', term_records: 'سجل منتهي',
  total_terminated: 'إجمالي المنتهية خدمتهم', unique_reasons: 'أسباب فريدة',
  top_reasons: 'أهم الأسباب (هذه الصفحة)', date_left: 'تاريخ المغادرة',
  reason: 'السبب', terminated_records: 'السجلات المنتهية',
  // Home
  welcome: 'مرحباً بعودتك', home_sub: 'إليك نظرة عامة على لوحة تحكم السائقين',
  quick_stats: 'إحصائيات سريعة', compliance_alerts: 'تنبيهات الامتثال',
  // Settings
  settings_title: 'الإعدادات', user_management: 'إدارة المستخدمين',
  language: 'اللغة', language_label: 'لغة الواجهة',
  english: 'English', arabic: 'العربية',
  add_user: 'إضافة مستخدم', username: 'اسم المستخدم', email: 'البريد الإلكتروني',
  password: 'كلمة المرور', role: 'الدور', administrator: 'مدير', viewer: 'مشاهد',
  // KPI
  kpi_total: 'الإجمالي', kpi_active: 'نشط', kpi_terminated: 'منتهي', kpi_recruitment: 'التوظيف',
}

const EN = {
  home: 'Home', drivers: 'Drivers Profile', documents: 'Document Compliance',
  recruitment: 'Recruitment', terminated: 'Terminated Drivers',
  analytics: 'Analytics', settings: 'Settings', logout: 'Logout', logged_out: 'Logged out',
  search: 'Search', reset: 'Reset', save: 'Save', cancel: 'Cancel',
  delete: 'Delete', edit: 'Edit', add: 'Add', import_csv: 'Import CSV',
  slicers: 'Slicers', filters: 'Filters', print: 'Print Report',
  loading: 'Loading...', saving: 'Saving...', deleting: 'Deleting...',
  no_data: 'No data found', confirm_delete: 'Confirm Delete',
  active: 'Active', terminated_s: 'Terminated', all: 'All',
  drivers_title: 'Drivers Profile', total_records: 'total records',
  total: 'Total', this_page: 'This Page',
  rta_id: 'RTA ID', full_name: 'Full Name', nationality: 'Nationality',
  depot: 'Depot', contractor: 'Contractor', status: 'Status', id_card: 'ID Card',
  actions: 'Actions', add_driver: 'Add Driver', edit_driver: 'Edit Driver',
  date_of_hire: 'Date of Hire', date_of_birth: 'Date of Birth',
  license_number: 'License Number', license_expiry: 'License Expiry',
  passport_expiry: 'Passport Expiry', visa_expiry: 'Visa Expiry',
  medical_expiry: 'Medical Expiry', contact: 'Contact',
  search_placeholder: 'Search name or RTA ID...',
  showing: 'Showing', of: 'of',
  doc_title: 'Document Compliance', doc_sub: 'License, passport, visa and medical expiry status',
  license: 'Driving License', passport: 'Passport', visa: 'Visa', medical: 'Occupational Medical',
  expired: 'Expired', valid: 'Valid', critical: 'CRITICAL', warning: 'WARNING',
  compliance_records: 'Compliance Records', records: 'records',
  analytics_title: 'Analytics & Reports', live_data: 'Live data from your database',
  hire_trend: 'Hire Trend by Year', drivers_by_depot: 'Drivers by Depot',
  top_nationalities: 'Top Nationalities', by_contractor: 'By Contractor',
  id_card_status: 'ID Card Status', recruitment_status: 'Recruitment Status',
  road_test: 'Road Test Results', expired_docs: 'Expired Documents by Type',
  filtered_view: 'Filtered view — showing subset',
  rec_title: 'Recruitment Pipeline', candidates_tracked: 'candidates tracked',
  on_board: 'On Board', shortlisted: 'Shortlisted',
  road_test_pass: 'Road Test Pass', not_shortlisted: 'Not Shortlisted',
  pipeline_flow: 'Recruitment Pipeline Flow', total_applied: 'Total Applied',
  interview_pass: 'Interview Pass', candidate_records: 'Candidate Records',
  candidates: 'candidates', company: 'Company', interview: 'Interview',
  term_title: 'Terminated Drivers', term_records: 'terminated records',
  total_terminated: 'Total Terminated', unique_reasons: 'Unique Reasons',
  top_reasons: 'Top Reasons (this page)', date_left: 'Date Left',
  reason: 'Reason', terminated_records: 'Terminated Records',
  welcome: 'Welcome back', home_sub: 'Here\'s an overview of your driver dashboard',
  quick_stats: 'Quick Stats', compliance_alerts: 'Compliance Alerts',
  settings_title: 'Settings', user_management: 'User Management',
  language: 'Language', language_label: 'Interface Language',
  english: 'English', arabic: 'العربية',
  add_user: 'Add User', username: 'Username', email: 'Email',
  password: 'Password', role: 'Role', administrator: 'Administrator', viewer: 'Viewer',
  kpi_total: 'Total', kpi_active: 'Active', kpi_terminated: 'Terminated', kpi_recruitment: 'Recruitment',
  good_morning: 'صباح الخير', good_afternoon: 'مساء الخير', good_evening: 'مساء الخير',
  home_banner_title: 'لوحة تحكم عمليات خدمات السائقين',
  home_banner_sub: 'نظرة عامة لحظية على امتثال السائقين ومسار التوظيف والرواتب عبر جميع المستودعات.',
  home_drivers_desc: 'سجلات السائقين الكاملة والحالة والمستودع وتوزيع الجنسيات.',
  home_docs_desc: 'حالة انتهاء الرخصة والجواز والتأشيرة والفحص الطبي مع تنبيهات حرجة.',
  home_rec_desc: 'نتائج اختبار الطريق ونتائج المقابلات وحالة الالتحاق.',
  home_term_desc: 'سجلات السائقين المنتهية خدمتهم مع أسباب الاستقالة والتواريخ.',
  home_analytics_desc: 'اتجاهات التوظيف ومقارنات المستودعات وتوزيع الجنسيات وتقارير الوثائق.',
  home_chart_modules: 'وحدات الرسم البياني', home_modules: 'الوحدات', expiring_soon: 'تنتهي خلال 30 يوماً',
  expiring_soon_warning: 'يوجد وثائق تنتهي خلال 30 يوماً', expiring_soon_critical: 'يوجد وثائق تنتهي خلال 90 يوماً',
  expiring_soon_warning_color: '#f59e0b', expiring_soon_critical_color: '#ef4444',
  expiring_soon_warning_text: 'تحذير', expiring_soon_critical_text: 'حرج',
  expiring_soon_warning_icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
  expiring_soon_critical_icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
  expiring_soon_warning_text: 'تحذير', expiring_soon_critical_text: 'حرج',
  expiring_soon_warning_icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
  expiring_soon_critical_icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
}

export const TRANSLATIONS = { en: EN, ar: AR }

export const useStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('ds_user') || 'null'),
  token: localStorage.getItem('ds_token') || null,
  lang: localStorage.getItem('ds_lang') || 'en',

  setAuth: (user, token) => {
    localStorage.setItem('ds_token', token)
    localStorage.setItem('ds_user', JSON.stringify(user))
    set({ user, token })
  },

  clearAuth: () => {
    localStorage.removeItem('ds_token')
    localStorage.removeItem('ds_user')
    set({ user: null, token: null })
  },

  isAdmin: () => get().user?.role === 'Administrator',

  setLang: (lang) => {
    localStorage.setItem('ds_lang', lang)
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
    set({ lang })
  },

  t: (key) => {
    const lang = get().lang
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key
  },
}))