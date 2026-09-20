import { 
  Product, 
  User, 
  PurchaseOrder, 
  InvoiceAR, 
  BillAP, 
  JournalEntry, 
  ExpenseRecord, 
  Employee, 
  BranchPerformance, 
  GDPRConsent,
  NotificationItem,
  TenantContext,
  TerminalDevice,
  DeviceInvite,
  SubscriptionPackage,
  SubscriptionEmailAlert,
  TenantCommunication
} from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-hive-root',
    name: 'Platform Root Host (Hive Master)',
    email: 'aqutewavedev@gmail.com',
    password: 'bluenilla123',
    role: 'system_host',
    userCategory: 'system_host',
    workspace: 'hive_master',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    pin: '0000',
    biometricRegistered: true,
    branchId: 'all',
    branchName: 'Central Cloud Infrastructure & Host Root',
    permissions: ['*'],
    lastLogin: 'Today, 06:00 AM'
  },
  {
    id: 'usr-owner',
    name: 'Marcus Vance',
    email: 'marcus.owner@bluenilla.com',
    password: 'ownerpass123',
    role: 'business_owner',
    userCategory: 'business_owner',
    workspace: 'manager',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    pin: '8888',
    biometricRegistered: true,
    branchId: 'br-1',
    branchName: 'Downtown Flagship Roastery',
    tenantId: 'tenant_bluenilla_corp',
    permissions: ['tenant.manage', 'tenant.terminals.invite', 'tenant.terminals.revoke', 'manager.*', 'reports.*', 'pos.*'],
    lastLogin: 'Today, 07:15 AM'
  },
  {
    id: 'usr-owner-bakery',
    name: 'Claire Delacroix',
    email: 'claire.bakery@artisanbakery.com',
    password: 'bakerypass123',
    role: 'business_owner',
    userCategory: 'business_owner',
    workspace: 'manager',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    pin: '7777',
    biometricRegistered: true,
    branchId: 'br-bk1',
    branchName: 'Uptown Bakery & Espresso Bar',
    tenantId: 'tenant_artisan_bakery',
    permissions: ['tenant.manage', 'tenant.terminals.invite', 'tenant.terminals.revoke', 'manager.*', 'reports.*', 'pos.*'],
    lastLogin: 'Today, 08:10 AM'
  },
  {
    id: 'usr-owner-pacific',
    name: 'Kenji Tanaka',
    email: 'kenji.lifestyle@pacificmerch.com',
    password: 'pacificpass123',
    role: 'business_owner',
    userCategory: 'business_owner',
    workspace: 'manager',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    pin: '6666',
    biometricRegistered: true,
    branchId: 'br-harbor',
    branchName: 'Harbor Walk Merchandising',
    tenantId: 'tenant_pacific_merch',
    permissions: ['tenant.manage', 'tenant.terminals.invite', 'tenant.terminals.revoke', 'manager.*', 'reports.*', 'pos.*'],
    lastLogin: 'Today, 07:50 AM'
  },
  {
    id: 'usr-1',
    name: 'Sarah Connor',
    email: 's.connor@bluenilla.com',
    password: 'cashierpass123',
    role: 'cashier',
    userCategory: 'staff',
    workspace: 'sales',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    pin: '1234',
    biometricRegistered: true,
    branchId: 'br-1',
    branchName: 'Downtown Flagship',
    tenantId: 'tenant_bluenilla_corp',
    permissions: ['pos.checkout', 'pos.park', 'pos.discounts.standard'],
    lastLogin: 'Today, 08:15 AM'
  },
  {
    id: 'usr-2',
    name: 'Marcus Chen',
    email: 'm.chen@bluenilla.com',
    password: 'receiverpass123',
    role: 'receiver',
    userCategory: 'staff',
    workspace: 'storeroom',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    pin: '2345',
    biometricRegistered: true,
    branchId: 'br-1',
    branchName: 'Downtown Flagship',
    tenantId: 'tenant_bluenilla_corp',
    permissions: ['inventory.receive', 'inventory.adjust', 'inventory.print_labels'],
    lastLogin: 'Today, 07:45 AM'
  },
  {
    id: 'usr-3',
    name: 'Elena Rostova',
    email: 'e.rostova@bluenilla.com',
    password: 'accountspass123',
    role: 'accountant',
    userCategory: 'staff',
    workspace: 'accounts',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    pin: '3456',
    biometricRegistered: false,
    branchId: 'br-hq',
    branchName: 'Headquarters',
    tenantId: 'tenant_bluenilla_corp',
    permissions: ['accounts.ar', 'accounts.ap', 'accounts.gl', 'reports.financial'],
    lastLogin: 'Today, 09:00 AM'
  },
  {
    id: 'usr-4',
    name: 'Jordan Rivera',
    email: 'j.rivera@bluenilla.com',
    password: 'hrpass123',
    role: 'hr_officer',
    userCategory: 'staff',
    workspace: 'hr',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    pin: '4567',
    biometricRegistered: true,
    branchId: 'br-hq',
    branchName: 'Headquarters',
    tenantId: 'tenant_bluenilla_corp',
    permissions: ['hr.roster', 'hr.attendance', 'hr.leave', 'hr.payroll'],
    lastLogin: 'Today, 08:30 AM'
  },
  {
    id: 'usr-5',
    name: 'David Vance',
    email: 'd.vance@bluenilla.com',
    password: 'managerpass123',
    role: 'store_manager',
    userCategory: 'staff',
    workspace: 'manager',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    pin: '5678',
    biometricRegistered: true,
    branchId: 'br-1',
    branchName: 'Downtown Flagship',
    tenantId: 'tenant_bluenilla_corp',
    permissions: ['manager.approvals', 'manager.overrides', 'reports.sales', 'analytics.branches'],
    lastLogin: 'Today, 07:30 AM'
  },
  {
    id: 'usr-6',
    name: 'Alex Mercer (Admin)',
    email: 'admin.it@bluenilla.com',
    password: 'itadminpass123',
    role: 'it_admin',
    userCategory: 'staff',
    workspace: 'it',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    pin: '9999',
    biometricRegistered: true,
    branchId: 'br-hq',
    branchName: 'Operations Center',
    tenantId: 'tenant_bluenilla_corp',
    permissions: ['it.diagnostics', 'it.sync', 'it.rbac', 'it.audit', 'it.gdpr', 'it.backup'],
    lastLogin: 'Just now'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-101',
    sku: 'BN-BEV-001',
    barcode: '884019234101',
    name: 'Blue Vanilla Cold Brew 330ml',
    category: 'Beverages',
    price: 4.75,
    costPrice: 1.80,
    stock: 84,
    reorderPoint: 20,
    binLocation: 'Aisle 1 - Bay A - Shelf 2',
    batchLotNumber: 'LOT-2026-B01',
    expiryDate: '2026-11-15',
    supplier: 'Blue Mountain Roasters',
    taxRate: 0.08,
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=300&auto=format&fit=crop&q=80',
    description: 'Signature artisan cold brew infused with organic Madagascar vanilla.'
  },
  {
    id: 'prod-102',
    sku: 'BN-BEV-002',
    barcode: '884019234102',
    name: 'Nitro Oat Flat White 250ml',
    category: 'Beverages',
    price: 5.25,
    costPrice: 2.10,
    stock: 42,
    reorderPoint: 15,
    binLocation: 'Aisle 1 - Bay A - Shelf 3',
    batchLotNumber: 'LOT-2026-N04',
    expiryDate: '2026-10-30',
    supplier: 'Nordic Oats Collective',
    taxRate: 0.08,
    imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&auto=format&fit=crop&q=80',
    description: 'Smooth nitrogenated micro-foam oat flat white in recyclable aluminum can.'
  },
  {
    id: 'prod-103',
    sku: 'BN-BAK-001',
    barcode: '884019234103',
    name: 'Almond Croissant Artisan',
    category: 'Bakery',
    price: 4.50,
    costPrice: 1.60,
    stock: 18,
    reorderPoint: 10,
    binLocation: 'Bakery Rack - Tray 4',
    batchLotNumber: 'BAK-TODAY-01',
    expiryDate: '2026-09-08',
    supplier: 'La Boulangerie Central',
    taxRate: 0.05,
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&auto=format&fit=crop&q=80',
    description: 'Twice-baked butter croissant loaded with frangipane cream and toasted almonds.'
  },
  {
    id: 'prod-104',
    sku: 'BN-BAK-002',
    barcode: '884019234104',
    name: 'Blueberry Sourdough Muffin',
    category: 'Bakery',
    price: 3.95,
    costPrice: 1.20,
    stock: 24,
    reorderPoint: 8,
    binLocation: 'Bakery Rack - Tray 2',
    batchLotNumber: 'BAK-TODAY-02',
    expiryDate: '2026-09-09',
    supplier: 'La Boulangerie Central',
    taxRate: 0.05,
    imageUrl: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=300&auto=format&fit=crop&q=80',
    description: 'Wild blueberry sourdough muffin topped with cinnamon sugar crunch.'
  },
  {
    id: 'prod-105',
    sku: 'BN-MER-001',
    barcode: '884019234105',
    name: 'Ceramic Tumbler 16oz (Matte Indigo)',
    category: 'Merchandise',
    price: 26.00,
    costPrice: 9.50,
    stock: 35,
    reorderPoint: 12,
    binLocation: 'Aisle 3 - Bay C - Shelf 1',
    batchLotNumber: 'MERCH-CER-2026',
    supplier: 'Kinto Studio Japan',
    taxRate: 0.08,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80',
    description: 'Double-wall insulated ceramic travel mug with splash-proof lid.'
  },
  {
    id: 'prod-106',
    sku: 'BN-COF-001',
    barcode: '884019234106',
    name: 'Ethiopia Yirgacheffe Whole Bean 250g',
    category: 'Coffee Beans',
    price: 18.50,
    costPrice: 8.00,
    stock: 29,
    reorderPoint: 10,
    binLocation: 'Aisle 2 - Bay B - Shelf 1',
    batchLotNumber: 'ROAST-26-088',
    expiryDate: '2027-02-28',
    supplier: 'Direct Trade Cooperatives',
    taxRate: 0.00, // zero-rated food staple
    imageUrl: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=300&auto=format&fit=crop&q=80',
    description: 'Heirloom variety with tasting notes of bergamot, jasmine blossom, and peach.'
  },
  {
    id: 'prod-107',
    sku: 'BN-SAN-001',
    barcode: '884019234107',
    name: 'Smoked Turkey & Havarti Panini',
    category: 'Fresh Food',
    price: 9.25,
    costPrice: 3.80,
    stock: 14,
    reorderPoint: 6,
    binLocation: 'Chiller Display A - Row 1',
    batchLotNumber: 'DELI-20260907',
    expiryDate: '2026-09-08',
    supplier: 'Green Valley Farms',
    taxRate: 0.08,
    imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&auto=format&fit=crop&q=80',
    description: 'Roasted herb turkey breast, havarti cheese, arugula, and cranberry aioli on sourdough.'
  },
  {
    id: 'prod-108',
    sku: 'BN-TEA-001',
    barcode: '884019234108',
    name: 'Organic Ceremonial Matcha 50g',
    category: 'Beverages',
    price: 24.00,
    costPrice: 11.20,
    stock: 22,
    reorderPoint: 8,
    binLocation: 'Aisle 2 - Bay C - Shelf 4',
    batchLotNumber: 'MATCHA-UJI-09',
    expiryDate: '2027-06-30',
    supplier: 'Uji Heritage Farms',
    taxRate: 0.08,
    imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=300&auto=format&fit=crop&q=80',
    description: 'First harvest stone-ground ceremonial grade Japanese matcha from Uji, Kyoto.'
  }
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-9021',
    poNumber: 'PO-2026-084',
    vendorName: 'Blue Mountain Roasters',
    orderDate: '2026-09-02',
    expectedDate: '2026-09-08',
    status: 'pending',
    items: [
      { sku: 'BN-BEV-001', name: 'Blue Vanilla Cold Brew 330ml', orderedQty: 120, receivedQty: 0, unitCost: 1.80 },
      { sku: 'BN-COF-001', name: 'Ethiopia Yirgacheffe Whole Bean 250g', orderedQty: 50, receivedQty: 0, unitCost: 8.00 }
    ],
    totalValue: 616.00,
    notes: 'Urgent weekend stock replenish for Downtown Flagship.'
  },
  {
    id: 'po-9022',
    poNumber: 'PO-2026-085',
    vendorName: 'Kinto Studio Japan',
    orderDate: '2026-08-28',
    expectedDate: '2026-09-06',
    status: 'partially_received',
    items: [
      { sku: 'BN-MER-001', name: 'Ceramic Tumbler 16oz (Matte Indigo)', orderedQty: 60, receivedQty: 30, unitCost: 9.50 }
    ],
    totalValue: 570.00,
    notes: 'Partial shipment received via air courier; remaining 30 units in transit.'
  }
];

export const INITIAL_INVOICES_AR: InvoiceAR[] = [
  {
    id: 'inv-101',
    invoiceNumber: 'INV-2026-0331',
    customerName: 'Apex Creative Agency',
    customerEmail: 'billing@apexcreative.io',
    issueDate: '2026-08-15',
    dueDate: '2026-09-14',
    amount: 1450.00,
    paidAmount: 700.00,
    status: 'partial'
  },
  {
    id: 'inv-102',
    invoiceNumber: 'INV-2026-0342',
    customerName: 'Finovate Capital Corp',
    customerEmail: 'ap@finovate.com',
    issueDate: '2026-08-20',
    dueDate: '2026-09-05',
    amount: 2890.00,
    paidAmount: 0.00,
    status: 'overdue'
  },
  {
    id: 'inv-103',
    invoiceNumber: 'INV-2026-0355',
    customerName: 'Metro Tech Hub Coworking',
    customerEmail: 'ops@metrotechhub.org',
    issueDate: '2026-09-01',
    dueDate: '2026-09-30',
    amount: 3200.00,
    paidAmount: 3200.00,
    status: 'paid'
  }
];

export const INITIAL_BILLS_AP: BillAP[] = [
  {
    id: 'bill-501',
    billNumber: 'BILL-VEND-882',
    vendorName: 'Consolidated Electric & Gas',
    category: 'Utilities',
    billDate: '2026-08-25',
    dueDate: '2026-09-15',
    amount: 840.50,
    status: 'scheduled'
  },
  {
    id: 'bill-502',
    billNumber: 'BILL-VEND-883',
    vendorName: 'La Boulangerie Central',
    category: 'Inventory Cost',
    billDate: '2026-09-01',
    dueDate: '2026-09-18',
    amount: 1320.00,
    status: 'unpaid'
  },
  {
    id: 'bill-503',
    billNumber: 'BILL-VEND-884',
    vendorName: 'CloudScale POS Server Hosting',
    category: 'Software & IT',
    billDate: '2026-09-01',
    dueDate: '2026-09-07',
    amount: 249.00,
    status: 'paid'
  }
];

export const INITIAL_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 'je-1',
    reference: 'JV-2026-0091',
    date: '2026-09-07',
    description: 'Daily POS Sales Cash & Card Deposit',
    debitAccount: '1010 - Operating Cash / Merchant Bank',
    creditAccount: '4010 - POS Merchandise & Beverage Revenue',
    amount: 4892.40,
    postedBy: 'Elena Rostova'
  },
  {
    id: 'je-2',
    reference: 'JV-2026-0092',
    date: '2026-09-07',
    description: 'Inventory Cost of Goods Sold Allocation',
    debitAccount: '5010 - Cost of Goods Sold (COGS)',
    creditAccount: '1200 - Merchandise Inventory Asset',
    amount: 1940.15,
    postedBy: 'Elena Rostova'
  },
  {
    id: 'je-3',
    reference: 'JV-2026-0093',
    date: '2026-09-06',
    description: 'Store Facility Air Quality & Filter Service',
    debitAccount: '6120 - Store Repair & Maintenance',
    creditAccount: '1010 - Operating Cash',
    amount: 320.00,
    postedBy: 'Elena Rostova'
  }
];

export const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp-1',
    date: '2026-09-07',
    category: 'Supplies',
    payee: 'PaperPack POS Rolls Co.',
    amount: 86.50,
    receiptNumber: 'REC-PP-4921',
    paymentMethod: 'Corporate Debit Card',
    approvedBy: 'David Vance'
  },
  {
    id: 'exp-2',
    date: '2026-09-06',
    category: 'Logistics',
    payee: 'Swift Express Courier',
    amount: 145.00,
    receiptNumber: 'SWIFT-99120',
    paymentMethod: 'Corporate Debit Card',
    approvedBy: 'David Vance'
  },
  {
    id: 'exp-3',
    date: '2026-09-05',
    category: 'Software & IT',
    payee: 'Twilio SMS & Barcode API Gateway',
    amount: 64.20,
    receiptNumber: 'TW-INV-8910',
    paymentMethod: 'ACH Transfer',
    approvedBy: 'Alex Mercer'
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    employeeCode: 'BN-0104',
    name: 'Sarah Connor',
    email: 's.connor@bluenilla.com',
    role: 'Lead Cashier',
    department: 'Front of House',
    hourlyRate: 19.50,
    status: 'active',
    phone: '+1 (555) 234-8901',
    emergencyContact: 'John Connor (+1 555-901-2244)',
    hireDate: '2024-03-15',
    biometricEnrolled: true
  },
  {
    id: 'emp-2',
    employeeCode: 'BN-0108',
    name: 'Marcus Chen',
    email: 'm.chen@bluenilla.com',
    role: 'Storeroom Lead Receiver',
    department: 'Supply & Logistics',
    hourlyRate: 21.00,
    status: 'active',
    phone: '+1 (555) 883-1102',
    emergencyContact: 'Mei Chen (+1 555-883-9912)',
    hireDate: '2023-11-01',
    biometricEnrolled: true
  },
  {
    id: 'emp-3',
    employeeCode: 'BN-0112',
    name: 'Tanya Morales',
    email: 't.morales@bluenilla.com',
    role: 'Barista & Register Associate',
    department: 'Front of House',
    hourlyRate: 18.00,
    status: 'on_break',
    phone: '+1 (555) 674-9021',
    emergencyContact: 'Carlos Morales (+1 555-674-9022)',
    hireDate: '2025-01-10',
    biometricEnrolled: true
  },
  {
    id: 'emp-4',
    employeeCode: 'BN-0115',
    name: 'Liam Gallagher',
    email: 'l.gallagher@bluenilla.com',
    role: 'Stock Associate & Driver',
    department: 'Supply & Logistics',
    hourlyRate: 18.50,
    status: 'shift_off',
    phone: '+1 (555) 431-8890',
    emergencyContact: 'Fiona Gallagher (+1 555-431-8891)',
    hireDate: '2025-04-20',
    biometricEnrolled: false
  },
  {
    id: 'emp-5',
    employeeCode: 'BN-0021',
    name: 'David Vance',
    email: 'd.vance@bluenilla.com',
    role: 'General Store Manager',
    department: 'Retail Operations',
    hourlyRate: 34.00,
    status: 'active',
    phone: '+1 (555) 991-0023',
    emergencyContact: 'Claire Vance (+1 555-991-0024)',
    hireDate: '2022-06-01',
    biometricEnrolled: true
  }
];

export const INITIAL_BRANCHES: BranchPerformance[] = [
  {
    branchId: 'br-1',
    name: 'Downtown Flagship',
    address: '742 Evergreen Blvd, Metro District',
    todaySales: 4892.40,
    targetSales: 5200.00,
    transactionsCount: 248,
    averageBasket: 19.72,
    topCashier: 'Sarah Connor ($2,410)',
    syncStatus: 'synced'
  },
  {
    branchId: 'br-2',
    name: 'West End Galleria',
    address: '420 West End Avenue, Retail Wing B',
    todaySales: 3910.80,
    targetSales: 4100.00,
    transactionsCount: 194,
    averageBasket: 20.15,
    topCashier: 'Kevin Lin ($1,880)',
    syncStatus: 'synced'
  },
  {
    branchId: 'br-3',
    name: 'Harbor Express Kiosk',
    address: 'Pier 17 Transit Terminal',
    todaySales: 2180.25,
    targetSales: 2000.00,
    transactionsCount: 162,
    averageBasket: 13.45,
    topCashier: 'Maya Patel ($1,290)',
    syncStatus: 'syncing'
  }
];

export const INITIAL_GDPR_CONSENTS: GDPRConsent[] = [
  {
    id: 'gdpr-001',
    subjectId: 'cust-901',
    subjectName: 'Julian Thorne',
    subjectEmail: 'j.thorne@example.org',
    consents: {
      posTransactionalData: true,
      marketingCommunication: false,
      biometricVerification: true,
      deviceAnalytics: true
    },
    consentDate: '2026-05-12',
    anonymized: false
  },
  {
    id: 'gdpr-002',
    subjectId: 'cust-902',
    subjectName: 'Amara Ndiaye',
    subjectEmail: 'amara.n@worldmail.com',
    consents: {
      posTransactionalData: true,
      marketingCommunication: true,
      biometricVerification: true,
      deviceAnalytics: false
    },
    consentDate: '2026-06-20',
    anonymized: false
  },
  {
    id: 'gdpr-003',
    subjectId: 'cust-882',
    subjectName: '[Anonymized Subject #882]',
    subjectEmail: 'anonymized-gdpr-882@deleted.local',
    consents: {
      posTransactionalData: true, // Retained for accounting statutory laws
      marketingCommunication: false,
      biometricVerification: false,
      deviceAnalytics: false
    },
    consentDate: '2026-03-01',
    anonymized: true
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Low Stock Alert',
    message: 'Almond Croissant Artisan has reached 18 units (reorder trigger: 20).',
    type: 'warning',
    timestamp: '10m ago',
    read: false,
    targetWorkspace: 'storeroom'
  },
  {
    id: 'notif-2',
    title: 'Pending Manager Approval',
    message: 'Sarah Connor requested a 25% corporate discount override on Order #BN-902.',
    type: 'info',
    timestamp: '25m ago',
    read: false,
    targetWorkspace: 'manager'
  },
  {
    id: 'notif-3',
    title: 'Offline Sync Engine',
    message: '6 field POS transactions synced successfully with Hive Master Central.',
    type: 'success',
    timestamp: '1h ago',
    read: true,
    targetWorkspace: 'it'
  },
  {
    id: 'notif-4',
    title: 'Purchase Order Delivered',
    message: 'PO-2026-085 (Kinto Studio) partial intake completed by Marcus Chen.',
    type: 'info',
    timestamp: '2h ago',
    read: true,
    targetWorkspace: 'storeroom'
  }
];

export const INITIAL_TENANTS: TenantContext[] = [
  {
    id: 'ten-bluenilla',
    tenantId: 'tenant_bluenilla_corp',
    tenantName: 'Bluenilla Coffee Roasters Corp',
    businessId: 'biz_downtown_flagship',
    businessName: 'Downtown Flagship Roastery',
    subdomain: 'downtown.bluenilla.com',
    plan: 'Enterprise',
    status: 'active',
    isSubscribed: true,
    branchAddress: '100 Main Street, Suite 101, Downtown',
    ownerEmail: 'marcus.owner@bluenilla.com',
    createdAt: '2025-01-15',
    contactEmail: 'ops@bluenilla.com',
    mobileNumber: '+1 (555) 234-8901',
    isWhatsAppAvailable: true,
    whatsappNumber: '+1 (555) 234-8901',
    currency: 'USD',
    timezone: 'America/New_York',
    enabledModules: {
      sales: true,
      storeroom: true,
      accounts: true,
      hr: true,
      manager: true,
      it: true
    },
    monthlyFee: 499,
    terminalQuota: 12,
    activeTerminalsCount: 4,
    databaseCluster: 'mysql-cluster-us-east-prod-01',
    expiresAt: '2027-09-18T00:00:00.000Z',
    approvedAt: '2026-09-15T10:00:00.000Z',
    approvedBy: 'aqutewavedev@gmail.com',
    billingCycle: 'monthly',
    subscriptionPaidDate: '2026-09-01'
  },
  {
    id: 'ten-bluenilla-airport',
    tenantId: 'tenant_bluenilla_corp',
    tenantName: 'Bluenilla Coffee Roasters Corp',
    businessId: 'biz_airport_t3',
    businessName: 'Airport Terminal 3 Express',
    subdomain: 'airport-t3.bluenilla.com',
    plan: 'Professional',
    status: 'unsubscribed',
    isSubscribed: false,
    branchAddress: 'Terminal 3 Concourse B, Gate 14, JFK Int Airport',
    ownerEmail: 'marcus.owner@bluenilla.com',
    createdAt: '2025-06-20',
    contactEmail: 'airport.ops@bluenilla.com',
    mobileNumber: '+1 (555) 234-8902',
    isWhatsAppAvailable: true,
    whatsappNumber: '+1 (555) 234-8902',
    currency: 'USD',
    timezone: 'America/New_York',
    enabledModules: {
      sales: true,
      storeroom: true,
      accounts: false,
      hr: false,
      manager: true,
      it: true
    },
    monthlyFee: 249,
    terminalQuota: 6,
    activeTerminalsCount: 2,
    databaseCluster: 'mysql-cluster-us-east-prod-01',
    expiresAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'ten-artisan-bakery',
    tenantId: 'tenant_artisan_bakery',
    tenantName: 'Artisan Pastry & Sweets Co.',
    businessId: 'biz_uptown_bakery',
    businessName: 'Uptown Bakery & Espresso Bar',
    subdomain: 'uptown.artisanbakery.com',
    plan: 'Professional',
    status: 'active',
    isSubscribed: true,
    branchAddress: '420 Lexington Ave, Uptown',
    ownerEmail: 'accounts@artisanbakery.com',
    createdAt: '2025-09-10',
    contactEmail: 'accounts@artisanbakery.com',
    mobileNumber: '+1 (555) 872-4419',
    isWhatsAppAvailable: true,
    whatsappNumber: '+1 (555) 872-4419',
    currency: 'USD',
    timezone: 'America/Chicago',
    enabledModules: {
      sales: true,
      storeroom: true,
      accounts: true,
      hr: false,
      manager: true,
      it: false
    },
    monthlyFee: 299,
    terminalQuota: 8,
    activeTerminalsCount: 3,
    databaseCluster: 'mysql-cluster-us-central-02',
    expiresAt: '2026-09-23T23:59:59.000Z', // Expires in 5 days! (Expiring Warning Alert)
    billingCycle: 'monthly',
    subscriptionNotes: 'Annual renewal reminder dispatched.'
  },
  {
    id: 'ten-sunset-deli',
    tenantId: 'tenant_sunset_grocers',
    tenantName: 'Sunset Grocers & Delicatessen LLC',
    businessId: 'biz_sunset_market',
    businessName: 'Sunset Organic Grocers & Deli',
    subdomain: 'sunset.bluenillapos.com',
    plan: 'Starter',
    status: 'past_due',
    isSubscribed: true,
    branchAddress: '88 Ocean Boulevard, Sunset District',
    ownerEmail: 'management@sunsetdeli.com',
    createdAt: '2025-08-01',
    contactEmail: 'billing@sunsetdeli.com',
    mobileNumber: '+1 (555) 412-9930',
    isWhatsAppAvailable: false,
    whatsappNumber: '',
    currency: 'USD',
    timezone: 'America/Los_Angeles',
    enabledModules: {
      sales: true,
      storeroom: true,
      accounts: false,
      hr: false,
      manager: false,
      it: false
    },
    monthlyFee: 149,
    terminalQuota: 4,
    activeTerminalsCount: 2,
    databaseCluster: 'mysql-cluster-us-west-01',
    expiresAt: '2026-09-14T00:00:00.000Z', // Expired 4 days ago! (Overdue Alert)
    billingCycle: 'monthly',
    subscriptionNotes: 'Payment method declined on Sept 14. Grace period active for 3 more days.'
  },
  {
    id: 'ten-pacific-retail',
    tenantId: 'tenant_pacific_merch',
    tenantName: 'Pacific Lifestyle Goods Group',
    businessId: 'biz_harbor_retail',
    businessName: 'Harbor Walk Merchandising',
    subdomain: 'harbor.pacificlifestyle.com',
    plan: 'Custom',
    customPlanName: 'Pacific Franchise Modular Pro',
    status: 'active',
    isSubscribed: true,
    branchAddress: 'Pier 39, Harbor Walk Suite 12',
    ownerEmail: 'support@pacificlifestyle.com',
    createdAt: '2026-02-01',
    contactEmail: 'billing@pacificlifestyle.com',
    currency: 'USD',
    timezone: 'America/Los_Angeles',
    enabledModules: {
      sales: true,
      storeroom: true,
      accounts: true,
      hr: true,
      manager: true,
      it: true
    },
    monthlyFee: 649,
    terminalQuota: 25,
    activeTerminalsCount: 5,
    databaseCluster: 'mysql-cluster-us-west-01',
    expiresAt: '2027-02-01T00:00:00.000Z',
    customSla: '99.99% Platinum Dedicated SLA',
    customGraceDays: 14,
    customMaxSku: 20000,
    customMaxDailyTx: 3000,
    subscriptionNotes: 'Bespoke corporate contract negotiated with Platform Host.'
  },
  {
    id: 'ten-metro-fashion',
    tenantId: 'tenant_metro_fashion',
    tenantName: 'Metro Apparel & Footwear Group',
    businessId: 'biz_metro_boutique',
    businessName: 'Metro High-Street Fashion',
    subdomain: 'metro.bluenillapos.com',
    plan: 'Professional',
    status: 'active',
    isSubscribed: true,
    branchAddress: '725 Fifth Avenue, Fashion District',
    ownerEmail: 'licensing@metrofashion.com',
    createdAt: '2026-09-01',
    contactEmail: 'accounts@metrofashion.com',
    currency: 'USD',
    timezone: 'America/New_York',
    enabledModules: {
      sales: true,
      storeroom: true,
      accounts: true,
      hr: false,
      manager: true,
      it: false
    },
    monthlyFee: 299,
    terminalQuota: 8,
    activeTerminalsCount: 3,
    databaseCluster: 'mysql-cluster-us-east-prod-01',
    expiresAt: '2027-09-17T00:00:00.000Z',
    approvedAt: '2026-09-17T14:30:00.000Z', // Recently Approved!
    approvedBy: 'aqutewavedev@gmail.com',
    billingCycle: 'annual',
    subscriptionNotes: 'Annual plan approved by Platform Host with 2-month discount.'
  }
];

export const INITIAL_SUBSCRIPTION_PACKAGES: SubscriptionPackage[] = [
  {
    id: 'pkg-starter',
    name: 'Starter Retail Till',
    slug: 'starter-retail',
    tier: 'Starter',
    monthlyFee: 149,
    annualFee: 1490,
    currency: 'USD',
    terminalQuota: 4,
    description: 'Essential point-of-sale checkout & inventory replenishment for single-location shops, coffee stalls, or specialty boutiques.',
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    borderClass: 'border-sky-500/50',
    highlightFeatures: [
      'Sales POS Register Till Checkout',
      'Storeroom Inventory & Stock Receiving',
      'Up to 4 POS Terminals Included',
      'Daily Automatic Cloud Backups',
      'Split tender cash/card payments'
    ],
    includedModules: {
      sales: true,
      storeroom: true,
      accounts: false,
      hr: false,
      manager: false,
      it: false
    },
    sla: '99.5% Core Availability SLA',
    status: 'active',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z'
  },
  {
    id: 'pkg-retail-pro',
    name: 'Retail Pro Merchant',
    slug: 'retail-pro',
    tier: 'Professional',
    monthlyFee: 219,
    annualFee: 2190,
    currency: 'USD',
    terminalQuota: 6,
    description: 'High-speed retail counter with advanced managerial intelligence and profit margin auditing for growing retail shops.',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    borderClass: 'border-emerald-500/50',
    highlightFeatures: [
      'Everything in Starter',
      'Manager Analytics & Till Audits',
      'Real-time gross margin & peak sales telemetry',
      'Up to 6 POS Terminals Included',
      'Priority offline synchronization'
    ],
    includedModules: {
      sales: true,
      storeroom: true,
      accounts: false,
      hr: false,
      manager: true,
      it: false
    },
    sla: '99.8% High Availability SLA',
    status: 'active',
    isPopular: true,
    createdAt: '2025-03-15T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z'
  },
  {
    id: 'pkg-professional',
    name: 'Professional Commercial Business',
    slug: 'professional-business',
    tier: 'Professional',
    monthlyFee: 299,
    annualFee: 2990,
    currency: 'USD',
    terminalQuota: 8,
    description: 'Complete commercial operations with full AR/AP accounting ledger and manager cash drawer reconciliation.',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    borderClass: 'border-indigo-500/50',
    highlightFeatures: [
      'Sales, Storeroom, Accounts & Manager Modules',
      'Customer Invoicing (AR) & Vendor Bills (AP)',
      'Double-entry ledger & sales tax filing',
      'Up to 8 POS Terminals Included',
      'Hourly sales analytics & executive PDF reports'
    ],
    includedModules: {
      sales: true,
      storeroom: true,
      accounts: true,
      hr: false,
      manager: true,
      it: false
    },
    sla: '99.9% High Availability SLA',
    status: 'active',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z'
  },
  {
    id: 'pkg-food-cafe',
    name: 'Quick-Service Hospitality & Cafe',
    slug: 'hospitality-cafe',
    tier: 'Enterprise',
    monthlyFee: 389,
    annualFee: 3890,
    currency: 'USD',
    terminalQuota: 10,
    description: 'Specialized package for restaurants, coffee roasters, and bakeries needing workforce shift management and fast customer ordering.',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    borderClass: 'border-amber-500/50',
    highlightFeatures: [
      'Sales POS with quick cash & split tender',
      'HR Workforce & Biometric Timeclock stamps',
      'Storeroom automatic recipe stock deduction',
      'Accounts billing & tip pooling calculation',
      'Up to 10 POS Terminals'
    ],
    includedModules: {
      sales: true,
      storeroom: true,
      accounts: true,
      hr: true,
      manager: true,
      it: false
    },
    sla: '99.95% Priority Hospitality SLA',
    status: 'active',
    createdAt: '2025-06-01T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z'
  },
  {
    id: 'pkg-enterprise',
    name: 'Enterprise Franchise & Fleet',
    slug: 'enterprise-franchise',
    tier: 'Enterprise',
    monthlyFee: 599,
    annualFee: 5990,
    currency: 'USD',
    terminalQuota: 25,
    description: 'Full unconstrained platform power with IT hardware fleet provisioning, multi-device telemetry, and 24/7 priority SLA.',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    borderClass: 'border-rose-500/50',
    highlightFeatures: [
      'All 6 Commercial Modules Fully Unlocked',
      'IT Fleet pairing & Redis telemetry monitor',
      'HR shift scheduling & biometric audit logs',
      'Up to 25 POS Terminals (Expandable)',
      'Dedicated Cloud Cluster & 24/7 Root SLA'
    ],
    includedModules: {
      sales: true,
      storeroom: true,
      accounts: true,
      hr: true,
      manager: true,
      it: true
    },
    sla: '99.99% Enterprise Dedicated SLA',
    status: 'active',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z'
  },
  {
    id: 'pkg-custom-bespoke',
    name: 'Custom Bespoke Modular',
    slug: 'custom-bespoke',
    tier: 'Custom',
    monthlyFee: 499,
    annualFee: 4990,
    currency: 'USD',
    terminalQuota: 15,
    description: 'Tailor-made subscription pack configured individually by Platform Host with custom terminal limits and module allocations.',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    borderClass: 'border-purple-500/50',
    highlightFeatures: [
      'Individually Tailored Module Matrix',
      'Custom Terminal Seat Count or Unlimited',
      'Negotiated SLA & Dedicated Sync Parameters',
      'Custom Grace Period and Multi-Store Support'
    ],
    includedModules: {
      sales: true,
      storeroom: true,
      accounts: true,
      hr: false,
      manager: true,
      it: false
    },
    sla: 'Negotiated Enterprise SLA',
    status: 'active',
    createdAt: '2025-04-10T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z'
  }
];

export const INITIAL_SUBSCRIPTION_ALERTS: SubscriptionEmailAlert[] = [
  {
    id: 'alert-mail-01',
    tenantId: 'tenant_sunset_grocers',
    businessName: 'Sunset Organic Grocers & Deli',
    recipientEmail: 'management@sunsetdeli.com',
    alertType: 'overdue_warning',
    subject: '🚨 URGENT: Your BlueNilla POS Subscription is Overdue (Action Required)',
    bodyHtml: '<p>Dear Sunset Organic Grocers Management,</p><p>Your BlueNilla POS subscription expired on Sept 14, 2026. Your account is currently in a 7-day Grace Period. Please renew immediately to avoid terminal lock.</p>',
    sentAt: '2026-09-15T09:00:00.000Z',
    status: 'sent',
    sentBy: 'aqutewavedev@gmail.com',
    daysRemaining: -4
  },
  {
    id: 'alert-mail-02',
    tenantId: 'tenant_artisan_bakery',
    businessName: 'Uptown Bakery & Espresso Bar',
    recipientEmail: 'accounts@artisanbakery.com',
    alertType: 'expiry_alert',
    subject: '⚠️ Renewal Notice: BlueNilla POS Subscription Expires in 5 Days',
    bodyHtml: '<p>Dear Uptown Bakery Team,</p><p>This is a courtesy alert that your Professional subscription will expire on September 23, 2026. Please confirm your renewal with Host.</p>',
    sentAt: '2026-09-18T08:30:00.000Z',
    status: 'sent',
    sentBy: 'aqutewavedev@gmail.com',
    daysRemaining: 5
  },
  {
    id: 'alert-mail-03',
    tenantId: 'tenant_metro_fashion',
    businessName: 'Metro High-Street Fashion',
    recipientEmail: 'licensing@metrofashion.com',
    alertType: 'subscription_approved',
    subject: '✅ Subscription Approved: Your BlueNilla POS Professional License is Active',
    bodyHtml: '<p>Welcome Metro High-Street Fashion,</p><p>Platform Host (aqutewavedev@gmail.com) has officially approved your Professional Annual Subscription with 8 register terminal seats. Valid until Sept 17, 2027.</p>',
    sentAt: '2026-09-17T14:35:00.000Z',
    status: 'sent',
    sentBy: 'aqutewavedev@gmail.com',
    daysRemaining: 364
  }
];

export const INITIAL_TERMINALS: TerminalDevice[] = [
  {
    id: 'term-01',
    terminalCode: 'REG-01',
    name: 'Lane 03 Main Checkout Till',
    tenantId: 'tenant_bluenilla_corp',
    businessId: 'biz_downtown_flagship',
    businessName: 'Downtown Flagship Roastery',
    deviceType: 'desktop',
    operatingSystem: 'Windows 11 POSReady',
    ipAddress: '192.168.1.101',
    appVersion: 'v2.4.2-hybrid',
    status: 'online',
    lastHeartbeat: '10s ago',
    unprocessedQueueCount: 0,
    assignedCashierId: 'usr-1',
    assignedCashierName: 'Sarah Connor',
    isRegistered: true
  },
  {
    id: 'term-02',
    terminalCode: 'REG-02',
    name: 'Drive-Thru Lane 1 Express',
    tenantId: 'tenant_bluenilla_corp',
    businessId: 'biz_downtown_flagship',
    businessName: 'Downtown Flagship Roastery',
    deviceType: 'desktop',
    operatingSystem: 'Ubuntu 24.04 LTS (Kiosk)',
    ipAddress: '192.168.1.102',
    appVersion: 'v2.4.2-hybrid',
    status: 'online',
    lastHeartbeat: '25s ago',
    unprocessedQueueCount: 0,
    assignedCashierId: 'usr-1',
    assignedCashierName: 'Sarah Connor',
    isRegistered: true
  },
  {
    id: 'term-03',
    terminalCode: 'MOB-01',
    name: 'Patio Line-Buster Mobile Handheld',
    tenantId: 'tenant_bluenilla_corp',
    businessId: 'biz_downtown_flagship',
    businessName: 'Downtown Flagship Roastery',
    deviceType: 'android',
    operatingSystem: 'Android 14 (Zebra TC58)',
    ipAddress: '10.0.4.52',
    appVersion: 'v2.4.2-apk',
    status: 'online',
    lastHeartbeat: '45s ago',
    unprocessedQueueCount: 1,
    batteryLevel: 82,
    isRegistered: true
  },
  {
    id: 'term-04',
    terminalCode: 'REG-T3A',
    name: 'Gate 22 Concourse Register',
    tenantId: 'tenant_bluenilla_corp',
    businessId: 'biz_airport_t3',
    businessName: 'Airport Terminal 3 Express',
    deviceType: 'desktop',
    operatingSystem: 'Windows 10 Enterprise LTSC',
    ipAddress: '172.16.8.12',
    appVersion: 'v2.4.1-hybrid',
    status: 'syncing',
    lastHeartbeat: '5s ago',
    unprocessedQueueCount: 3,
    isRegistered: true
  },
  {
    id: 'term-05',
    terminalCode: 'MOB-BK1',
    name: 'Bakery Counter Tablet',
    tenantId: 'tenant_artisan_bakery',
    businessId: 'biz_uptown_bakery',
    businessName: 'Uptown Bakery & Espresso Bar',
    deviceType: 'android',
    operatingSystem: 'Android 13 (Samsung Galaxy Tab Active)',
    ipAddress: '192.168.10.15',
    appVersion: 'v2.4.2-apk',
    status: 'offline',
    lastHeartbeat: '8m ago',
    unprocessedQueueCount: 4,
    batteryLevel: 61,
    isRegistered: true
  }
];

export const INITIAL_DEVICE_INVITES: DeviceInvite[] = [
  {
    id: 'inv-1',
    inviteCode: 'PAIR-BN-4190',
    tenantId: 'tenant_bluenilla_corp',
    businessId: 'biz_downtown_flagship',
    businessName: 'Downtown Flagship Roastery',
    terminalName: 'Patio Line-Buster Mobile 2',
    terminalCode: 'MOB-02',
    deviceType: 'android',
    branchId: 'br-1',
    branchName: 'Downtown Flagship',
    status: 'pending',
    createdAt: 'Today, 07:30 AM',
    expiresAt: '24 Hours',
    notes: 'New Zebra scanner for outdoor terrace during summer rush'
  },
  {
    id: 'inv-2',
    inviteCode: 'PAIR-BN-8821',
    tenantId: 'tenant_bluenilla_corp',
    businessId: 'biz_downtown_flagship',
    businessName: 'Downtown Flagship Roastery',
    terminalName: 'Lane 04 Express Self-Checkout',
    terminalCode: 'REG-04',
    deviceType: 'desktop',
    branchId: 'br-1',
    branchName: 'Downtown Flagship',
    status: 'pending',
    createdAt: 'Today, 08:00 AM',
    expiresAt: '7 Days',
    notes: 'Secondary kiosk display for lunch rush orders'
  },
  {
    id: 'inv-3',
    inviteCode: 'PAIR-BN-1029',
    tenantId: 'tenant_bluenilla_corp',
    businessId: 'biz_downtown_flagship',
    businessName: 'Downtown Flagship Roastery',
    terminalName: 'Lane 03 Main Checkout Till',
    terminalCode: 'REG-01',
    deviceType: 'desktop',
    branchId: 'br-1',
    branchName: 'Downtown Flagship',
    status: 'paired',
    createdAt: 'Yesterday, 02:00 PM',
    expiresAt: 'Completed',
    pairedAt: 'Yesterday, 02:15 PM',
    pairedDeviceId: 'term-01',
    notes: 'Initial register setup'
  }
];

export const INITIAL_COMMUNICATIONS: TenantCommunication[] = [
  {
    id: 'comm-01',
    tenantId: 'tenant_bluenilla_corp',
    tenantName: 'BlueNilla Retail Group (Marcus Vance)',
    recipientEmail: 'marcus.owner@bluenilla.com',
    recipientPhone: '+1 (555) 234-8901',
    recipientWhatsApp: '+1 (555) 234-8901',
    senderRole: 'hive_master',
    senderName: 'Hive Master Host',
    senderEmail: 'aqutewavedev@gmail.com',
    subject: 'Enterprise Cloud POS Cluster Provisioned & Ready',
    message: 'Hello Marcus, your Enterprise POS database cluster (mysql-cluster-us-east-prod-01) and real-time till synchronization are fully active. All 6 terminal seats are online. Feel free to contact our support team or reply directly inside the app.',
    channel: 'both',
    priority: 'normal',
    status: 'delivered',
    createdAt: '2026-09-18T10:30:00.000Z'
  },
  {
    id: 'comm-02',
    tenantId: 'tenant_artisan_bakery',
    tenantName: 'Artisan Pastry & Sweets Co. (Claire Delacroix)',
    recipientEmail: 'accounts@artisanbakery.com',
    recipientPhone: '+1 (555) 872-4419',
    recipientWhatsApp: '+1 (555) 872-4419',
    senderRole: 'hive_master',
    senderName: 'Hive Master Host',
    senderEmail: 'aqutewavedev@gmail.com',
    subject: 'Notice: Subscription Renewal Cycle Expiring in 5 Days',
    message: 'Greetings Claire, your Growth Tier subscription plan ($299/mo) renewal is approaching on Sep 23, 2026. Please verify your payment method in the Subscription Manager to ensure uninterrupted till connectivity.',
    channel: 'both',
    priority: 'important',
    status: 'delivered',
    createdAt: '2026-09-19T14:15:00.000Z'
  },
  {
    id: 'comm-03',
    tenantId: 'ALL_TENANTS',
    tenantName: 'All Registered Business Tenants (Broadcast)',
    recipientEmail: 'all-tenants-broadcast@hive.bluenilla.com',
    senderRole: 'hive_master',
    senderName: 'Hive Platform Admin',
    senderEmail: 'aqutewavedev@gmail.com',
    subject: 'Scheduled Platform Synchronization & Index Maintenance',
    message: 'System Host Announcement: Central telemetry and automated backup verification will occur Sunday at 02:00 UTC. Your offline register terminals will continue processing sales normally without interruption.',
    channel: 'in_app',
    priority: 'critical',
    status: 'delivered',
    createdAt: '2026-09-20T00:00:00.000Z'
  }
];

