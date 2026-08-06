export interface NavItem {
  route: string;
  label: string;
  icon: string;
}

export interface NavSection {
  title: string;
  groupIcon: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Principal',
    groupIcon: 'bi bi-house',
    items: [
      { route: '/system/home', label: 'Início', icon: 'bi bi-house' },
    ]
  },
  {
    title: 'Acadêmico',
    groupIcon: 'bi bi-mortarboard',
    items: [
      { route: '/system/student-onboarding', label: 'Cadastros', icon: 'bi bi-clipboard-check' },
      { route: '/system/students', label: 'Alunos', icon: 'bi bi-people' },
      { route: '/system/lessons', label: 'Aulas', icon: 'bi bi-calendar3' },
      { route: '/system/lesson-schedules', label: 'Grade de Horários', icon: 'bi bi-calendar-week' },
      { route: '/system/graduations', label: 'Graduações', icon: 'bi bi-award' },
      { route: '/system/frequencies', label: 'Frequências', icon: 'bi bi-check2-square' },
      { route: '/system/belts', label: 'Faixas', icon: 'bi bi-bookmark' },
      { route: '/system/graduation-requirements', label: 'Requisitos', icon: 'bi bi-list-check' },
    ]
  },
  {
    title: 'Financeiro',
    groupIcon: 'bi bi-wallet2',
    items: [
      { route: '/system/finance-dashboard', label: 'Dashboard', icon: 'bi bi-bar-chart-line' },
      { route: '/system/fee-plans', label: 'Planos', icon: 'bi bi-receipt' },
      { route: '/system/contracts', label: 'Contratos', icon: 'bi bi-file-earmark-text' },
      { route: '/system/contract-terms-templates', label: 'Modelos de Contrato', icon: 'bi bi-file-earmark-ruled' },
      { route: '/system/accounts-receivable', label: 'Contas a Receber', icon: 'bi bi-arrow-down-circle' },
      { route: '/system/accounts-payable', label: 'Contas a Pagar', icon: 'bi bi-arrow-up-circle' },
      { route: '/system/suppliers', label: 'Fornecedores', icon: 'bi bi-truck' },
      { route: '/system/transaction-categories', label: 'Categorias', icon: 'bi bi-tags' },
    ]
  },
  {
    title: 'Comunicação',
    groupIcon: 'bi bi-chat-dots',
    items: [
      { route: '/system/notices', label: 'Avisos', icon: 'bi bi-bell' },
      { route: '/system/notification', label: 'Notificações', icon: 'bi bi-megaphone' },
    ]
  },
  {
    title: 'Saúde e Segurança',
    groupIcon: 'bi bi-shield-check',
    items: [
      { route: '/system/medical-clearances', label: 'Atestados Médicos', icon: 'bi bi-heart-pulse' },
      { route: '/system/face-recognition', label: 'Reconhecimento', icon: 'bi bi-person-badge' },
    ]
  },
  {
    title: 'Configurações',
    groupIcon: 'bi bi-gear',
    items: [
      { route: '/system/academy-profile', label: 'Dados da Academia', icon: 'bi bi-building' },
      { route: '/system/payment-settings', label: 'Pagamentos', icon: 'bi bi-credit-card' },
      { route: '/system/scheduled-jobs', label: 'Rotinas Agendadas', icon: 'bi bi-clock-history' },
    ]
  },
];
