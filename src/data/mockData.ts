export type RequirementStatus = 'match' | 'partial' | 'new' | 'conflict';

export interface Requirement {
  id: string;
  code: string;
  text: string;
  component: string;
  source: string;
  status: RequirementStatus;
  matchPercent: number;
  matchedWith?: string;
  comment?: string;
  manualChecked?: boolean;
}

export interface DBRequirement {
  id: string;
  code: string;
  text: string;
  component: string;
  version: string;
  addedDate: string;
}

export const COMPONENTS = [
  'Модуль авторизации',
  'Платёжный шлюз',
  'Отчётность',
  'Интеграции',
  'Администрирование',
  'API Gateway',
];

export const mockResults: Requirement[] = [
  {
    id: '1',
    code: 'REQ-001',
    text: 'Система должна поддерживать авторизацию через LDAP с двухфакторной аутентификацией.',
    component: 'Модуль авторизации',
    source: 'ТЗ_v2.3.docx',
    status: 'match',
    matchPercent: 97,
    matchedWith: 'DB-AUTH-012',
    manualChecked: true,
  },
  {
    id: '2',
    code: 'REQ-002',
    text: 'Формирование отчётов должно происходить не более чем за 5 секунд при объёме до 10 000 записей.',
    component: 'Отчётность',
    source: 'ТЗ_v2.3.docx',
    status: 'partial',
    matchPercent: 72,
    matchedWith: 'DB-RPT-004',
    comment: 'В базе — 3 секунды. Необходима проверка.',
  },
  {
    id: '3',
    code: 'REQ-003',
    text: 'Интеграция с внешней системой ЭДО через REST API по протоколу OAuth 2.0.',
    component: 'Интеграции',
    source: 'ТЗ_v2.3.docx',
    status: 'new',
    matchPercent: 0,
    comment: 'Отсутствует в накопленной базе.',
  },
  {
    id: '4',
    code: 'REQ-004',
    text: 'Система должна сохранять журнал всех операций не менее 12 месяцев.',
    component: 'Администрирование',
    source: 'ТЗ_v2.3.docx',
    status: 'conflict',
    matchPercent: 61,
    matchedWith: 'DB-ADM-007',
    comment: 'В базе — 6 месяцев. Противоречие с ранее принятым решением.',
  },
  {
    id: '5',
    code: 'REQ-005',
    text: 'Платёжный модуль должен поддерживать системы: Visa, Mastercard, МИР, СБП.',
    component: 'Платёжный шлюз',
    source: 'ТЗ_v2.3.docx',
    status: 'match',
    matchPercent: 100,
    matchedWith: 'DB-PAY-001',
    manualChecked: true,
  },
  {
    id: '6',
    code: 'REQ-006',
    text: 'API Gateway должен обеспечивать rate limiting не менее 1000 запросов в секунду.',
    component: 'API Gateway',
    source: 'ТЗ_v2.3.docx',
    status: 'partial',
    matchPercent: 85,
    matchedWith: 'DB-API-003',
    comment: 'Базовое требование совпадает, лимит отличается.',
  },
];

export const mockDBRequirements: DBRequirement[] = [
  { id: 'DB-AUTH-012', code: 'DB-AUTH-012', text: 'Авторизация через LDAP с 2FA', component: 'Модуль авторизации', version: '2.1', addedDate: '2024-03-15' },
  { id: 'DB-AUTH-013', code: 'DB-AUTH-013', text: 'Сессии пользователей — TTL 8 часов', component: 'Модуль авторизации', version: '2.1', addedDate: '2024-03-15' },
  { id: 'DB-RPT-004', code: 'DB-RPT-004', text: 'Генерация отчётов до 3 секунд (до 10 000 записей)', component: 'Отчётность', version: '1.8', addedDate: '2023-11-20' },
  { id: 'DB-RPT-005', code: 'DB-RPT-005', text: 'Экспорт отчётов в форматы XLSX, PDF, CSV', component: 'Отчётность', version: '1.8', addedDate: '2023-11-20' },
  { id: 'DB-ADM-007', code: 'DB-ADM-007', text: 'Хранение журнала операций — 6 месяцев', component: 'Администрирование', version: '2.0', addedDate: '2024-01-10' },
  { id: 'DB-PAY-001', code: 'DB-PAY-001', text: 'Поддержка платёжных систем: Visa, Mastercard, МИР, СБП', component: 'Платёжный шлюз', version: '3.0', addedDate: '2024-05-01' },
  { id: 'DB-API-003', code: 'DB-API-003', text: 'Rate limiting: 500 запросов в секунду', component: 'API Gateway', version: '1.5', addedDate: '2023-09-08' },
];
