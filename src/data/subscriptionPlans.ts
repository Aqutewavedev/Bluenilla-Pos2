import { ModuleControlConfig, SubscriptionPlanTier } from '../types';

export interface ModuleDefinition {
  key: keyof ModuleControlConfig;
  name: string;
  tagline: string;
  category: 'Operations' | 'Inventory & PO' | 'Financials' | 'Workforce' | 'Intelligence' | 'Infrastructure';
  standaloneMonthlyFee: number;
  starterIncluded: boolean;
  professionalIncluded: boolean;
  enterpriseIncluded: boolean;
  coreFeatures: string[];
  iconName: 'ShoppingBag' | 'Package' | 'DollarSign' | 'Users' | 'BarChart3' | 'Cpu';
}

export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  {
    key: 'sales',
    name: 'Sales POS Register',
    tagline: 'High-speed till checkout, offline receipt engine, barcode scanning & digital payments',
    category: 'Operations',
    standaloneMonthlyFee: 99,
    starterIncluded: true,
    professionalIncluded: true,
    enterpriseIncluded: true,
    coreFeatures: [
      'Split tender payments (Cash, Card, NFC, QR)',
      'Offline IndexedDB ticket caching & auto-sync',
      'Barcode reader & customer display support',
      'Parked tickets & suspended orders'
    ],
    iconName: 'ShoppingBag'
  },
  {
    key: 'storeroom',
    name: 'Storeroom & PO Logistics',
    tagline: 'Stock receiving, low-inventory alerts, vendor purchase orders & audit reconciliation',
    category: 'Inventory & PO',
    standaloneMonthlyFee: 59,
    starterIncluded: true,
    professionalIncluded: true,
    enterpriseIncluded: true,
    coreFeatures: [
      'Live stock counts with automatic reorder thresholds',
      'Purchase Order creation with vendor PDF export',
      'Receiving dock discrepancy validation',
      'Shrinkage & damaged inventory adjustment logs'
    ],
    iconName: 'Package'
  },
  {
    key: 'accounts',
    name: 'Accounts & AR/AP Billing',
    tagline: 'Ledger synchronization, accounts receivable/payable, invoice dispatch & tax filing',
    category: 'Financials',
    standaloneMonthlyFee: 79,
    starterIncluded: false,
    professionalIncluded: true,
    enterpriseIncluded: true,
    coreFeatures: [
      'Automated double-entry reconciliation',
      'Customer Accounts Receivable invoice dispatch',
      'Vendor bill payment & payable aging',
      'Sales tax calculation & financial ledger exports'
    ],
    iconName: 'DollarSign'
  },
  {
    key: 'hr',
    name: 'HR Workforce & Roster',
    tagline: 'Employee shift scheduling, biometric timeclock stamps, wage rates & tips',
    category: 'Workforce',
    standaloneMonthlyFee: 69,
    starterIncluded: false,
    professionalIncluded: false,
    enterpriseIncluded: true,
    coreFeatures: [
      'Weekly shift schedule builder & availability',
      'Biometric clock-in / clock-out audit log',
      'Hourly wage calculation & tip pooling',
      'Staff performance tracking & shift notes'
    ],
    iconName: 'Users'
  },
  {
    key: 'manager',
    name: 'Manager Analytics & Till Audits',
    tagline: 'Real-time sales telemetry, gross profit margin analysis, cashier drawer reconciliation',
    category: 'Intelligence',
    standaloneMonthlyFee: 59,
    starterIncluded: false,
    professionalIncluded: true,
    enterpriseIncluded: true,
    coreFeatures: [
      'Cash drawer reconciliation (over/short reporting)',
      'Hourly sales peaks & department metrics',
      'Product profitability & margin breakdown',
      'Executive summary PDF report exports'
    ],
    iconName: 'BarChart3'
  },
  {
    key: 'it',
    name: 'IT Systems & Hardware Fleet',
    tagline: 'Register hardware pairing, Redis heartbeat telemetry, cloud snapshot backups & GDPR',
    category: 'Infrastructure',
    standaloneMonthlyFee: 99,
    starterIncluded: false,
    professionalIncluded: false,
    enterpriseIncluded: true,
    coreFeatures: [
      'Hardware till device invitation & pairing codes',
      'Redis queue monitor & sync depth telemetry',
      'Instant cloud JSON snapshot backup generator',
      'GDPR privacy consent & subject data erasure'
    ],
    iconName: 'Cpu'
  }
];

export interface PlanTierConfig {
  id: SubscriptionPlanTier;
  name: string;
  monthlyFee: number;
  terminalQuota: number;
  badgeClass: string;
  borderClass: string;
  description: string;
  defaultModules: ModuleControlConfig;
  highlightFeatures: string[];
  sla: string;
}

export const SUBSCRIPTION_PLAN_TIERS: Record<SubscriptionPlanTier, PlanTierConfig> = {
  Starter: {
    id: 'Starter',
    name: 'Starter Retail',
    monthlyFee: 149,
    terminalQuota: 4,
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    borderClass: 'border-sky-500/50',
    description: 'Essential POS checkout & stock replenishment for single-location shops or kiosks.',
    defaultModules: {
      sales: true,
      storeroom: true,
      accounts: false,
      hr: false,
      manager: false,
      it: false
    },
    highlightFeatures: [
      'Sales POS Register Till Checkout',
      'Storeroom Inventory & Stock Receiving',
      'Up to 4 POS Terminals Included',
      'Daily Cloud Database Backup'
    ],
    sla: '99.5% Core Availability'
  },
  Professional: {
    id: 'Professional',
    name: 'Professional Business',
    monthlyFee: 299,
    terminalQuota: 8,
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    borderClass: 'border-indigo-500/50',
    description: 'Complete commercial operations with financial billing and executive managerial analytics.',
    defaultModules: {
      sales: true,
      storeroom: true,
      accounts: true,
      hr: false,
      manager: true,
      it: false
    },
    highlightFeatures: [
      'Everything in Starter',
      'Accounts & AR/AP Invoicing & Reconciliation',
      'Manager Analytics & Drawer Reconciliation',
      'Up to 8 POS Terminals Included',
      'Priority Sync & Daily Snapshot Backups'
    ],
    sla: '99.9% High Availability SLA'
  },
  Enterprise: {
    id: 'Enterprise',
    name: 'Enterprise Franchise',
    monthlyFee: 599,
    terminalQuota: 25,
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    borderClass: 'border-amber-500/50',
    description: 'Full unconstrained platform capability with HR workforce rosters and multi-device IT fleet management.',
    defaultModules: {
      sales: true,
      storeroom: true,
      accounts: true,
      hr: true,
      manager: true,
      it: true
    },
    highlightFeatures: [
      'All 6 Commercial Modules Fully Unlocked',
      'HR Workforce Shift Scheduling & Biometrics',
      'IT Fleet Hardware Registration & Security Auditing',
      'Up to 25 POS Terminals (Expandable)',
      'Dedicated Cloud Cluster & 24/7 Priority SLA'
    ],
    sla: '99.99% Enterprise Dedicated Cluster SLA'
  },
  Custom: {
    id: 'Custom',
    name: 'Custom Modular',
    monthlyFee: 399,
    terminalQuota: 12,
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    borderClass: 'border-purple-500/50',
    description: 'Bespoke module allocation configured specifically by the Hive Master Platform Host.',
    defaultModules: {
      sales: true,
      storeroom: true,
      accounts: true,
      hr: false,
      manager: true,
      it: false
    },
    highlightFeatures: [
      'Individually Tailored Module Selection',
      'Negotiated Subscription Fee Agreement',
      'Custom Hardware Till Quota',
      'Tailored Sync & SLA Parameters'
    ],
    sla: 'Negotiated SLA Terms'
  }
};

/**
 * Calculates the total standalone market value of active modules
 */
export function calculateStandaloneValue(modules: ModuleControlConfig): number {
  return MODULE_DEFINITIONS.reduce((sum, mod) => {
    return modules[mod.key] ? sum + mod.standaloneMonthlyFee : sum;
  }, 0);
}

/**
 * Returns the recommended plan tier based on module selection
 */
export function getRecommendedPlanForModules(modules: ModuleControlConfig): SubscriptionPlanTier {
  if (modules.hr && modules.it) {
    return 'Enterprise';
  }
  if (modules.accounts || modules.manager) {
    return 'Professional';
  }
  if (modules.sales && modules.storeroom) {
    return 'Starter';
  }
  return 'Custom';
}

/**
 * Get module definition by key
 */
export function getModuleDefinition(key: keyof ModuleControlConfig): ModuleDefinition | undefined {
  return MODULE_DEFINITIONS.find(m => m.key === key);
}
