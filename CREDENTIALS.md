# BLUENILLA POS & Multi-Role Enterprise: System Credentials Matrix

This document provides testing credentials for all operational tiers in the BLUENILLA hybrid architecture: **Hive Master Platform Host**, **Business Tenant Owners**, **Departmental Store Staff**, and **Hardware POS Terminals**.

---

## 1. Hive Platform Host (Root Cloud Control Plane)

The Hive Master operator possesses root cluster permissions across all tenants, cloud telemetry, Redis replication, tenant provisioning, and module feature gating.

| Attribute | Value | Description |
| :--- | :--- | :--- |
| **Username / Email** | `aqutewavedev@gmail.com` | **Default Primary Hive Host** |
| **Password** | `bluenilla123` | Master password for credential validation |
| **Security PIN** | `0000` | Quick biometric / PIN override |
| **User ID** | `usr-hive-root` | Central system user identifier |
| **Role** | `system_host` | Root cluster operator |
| **Workspace** | `hive_master` | Dedicated Multi-Tenant Central Control Plane |
| **Branch Scope** | `all` | Global cluster infrastructure |
| **Permissions** | `["*"]` | Unrestricted access across all tenants & hardware |

### Hive Master Capabilities:
- Provision and suspend business tenants (`tenant_bluenilla_corp`, `tenant_artisan_bakery`, `tenant_pacific_merch`).
- Dynamically toggle module permissions per tenant (Sales, Storeroom, Accounts, HR, Manager, IT).
- Monitor cluster-wide sync queues, offline terminal queues, and Redis cluster heartbeats.

---

## 2. Business Tenant Owners (Scoped Fleet Management)

Business Owners manage their specific organization's branch stores, staff accounts, till quotas, and generate one-time pairing invitation codes for hardware devices.

| Tenant Name | Tenant ID | Business Owner | Username / Email | Password | PIN | Till Quota |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Bluenilla Coffee Roasters Corp** | `tenant_bluenilla_corp` | Marcus Vance | `marcus.owner@bluenilla.com` | `ownerpass123` | `8888` | 10 Tills |
| **Artisan Pastry & Sweets Co.** | `tenant_artisan_bakery` | Claire Delacroix | `claire.bakery@artisanbakery.com` | `bakerypass123` | `7777` | 4 Tills |
| **Pacific Lifestyle Goods Group** | `tenant_pacific_merch` | Kenji Tanaka | `kenji.lifestyle@pacificmerch.com` | `pacificpass123` | `6666` | 6 Tills |

### Business Owner Permissions:
- `tenant.manage`, `tenant.terminals.invite`, `tenant.terminals.revoke`, `manager.*`, `reports.*`, `pos.*`

---

## 3. Store Operations Staff (Department Workspaces)

Store staff are assigned role-based permissions scoped to their primary tenant and branch.

| Name | Role | Workspace | Username / Email | Password | PIN | Branch | Tenant ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Sarah Connor** | Cashier | `sales` | `s.connor@bluenilla.com` | `cashierpass123` | `1234` | Downtown Flagship | `tenant_bluenilla_corp` |
| **Marcus Chen** | Storeroom / Receiver | `storeroom` | `m.chen@bluenilla.com` | `receiverpass123` | `2345` | Downtown Flagship | `tenant_bluenilla_corp` |
| **Elena Rostova** | Accountant | `accounts` | `e.rostova@bluenilla.com` | `accountspass123` | `3456` | Headquarters | `tenant_bluenilla_corp` |
| **Jordan Rivera** | HR Officer | `hr` | `j.rivera@bluenilla.com` | `hrpass123` | `4567` | Headquarters | `tenant_bluenilla_corp` |
| **David Vance** | Store Manager | `manager` | `d.vance@bluenilla.com` | `managerpass123` | `5678` | Downtown Flagship | `tenant_bluenilla_corp` |
| **Alex Mercer** | IT Systems Admin | `it` | `admin.it@bluenilla.com` | `itadminpass123` | `9999` | Operations HQ | `tenant_bluenilla_corp` |

---

## 4. Hardware Terminals & POS Registers Fleet

Each POS terminal runs locally with offline IndexedDB storage and connects through encrypted WebSockets or REST sync queues.

| Terminal Code | Device Name | Device Type | Operating System | IP Address | Paired Tenant | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `REG-01` | Front Counter Till 1 | Desktop POS | Windows 11 Enterprise | `192.168.1.101` | `tenant_bluenilla_corp` | Online |
| `REG-02` | Express Bar Register | Desktop POS | Windows 11 Enterprise | `192.168.1.102` | `tenant_bluenilla_corp` | Online |
| `MOB-01` | Floor Scanner Handheld | Android Rugged | Android 14 POS Edition | `192.168.1.105` | `tenant_bluenilla_corp` | Online |
| `REG-BK1` | Main Bakery Checkout | Tablet Kiosk | iPadOS 17 POS Suite | `192.168.2.110` | `tenant_artisan_bakery` | Online |
| `MOB-BK1` | Curbside Runner | Android Handheld | Android 14 | `192.168.2.112` | `tenant_artisan_bakery` | Online |
| `PAC-POS1` | Harbor Floor Register | Desktop POS | macOS Sonoma 14 | `192.168.3.101` | `tenant_pacific_merch` | Online |

### Sample Pairing Invitation Tokens for Testing
To test self-pairing an unprovisioned terminal device:
- Pairing Code: `BN-PAIR-7890` (Scoped to Bluenilla Coffee Roasters Corp)
- Pairing Code: `BK-REG-4421` (Scoped to Artisan Pastry & Sweets Co.)
- Pairing Code: `PC-DEV-8822` (Scoped to Pacific Lifestyle Goods Group)

---

## 5. System Survey Mode (Unauthenticated Preview) & Real Authentication Matrix

The application strictly prevents unauthorized or unauthenticated operations on live store databases:

### A. Unauthenticated Guest Access (System Survey Mode)
- **Zero Exposure**: When an operator or guest accesses the application without logging in, the platform operates in **System Survey Mode**.
- **Empty Confidential Data**: All store catalogs, live inventory balances, order tables, parked tickets, and transaction histories are empty (`[]`). This ensures zero leakage of merchant data to unauthenticated visitors.
- **Architectural Surveying**: Visitors are allowed to explore the workspace layouts, examine the UI structure, view tab switches, and review billing/tier options.
- **Strict Execution Boundary**: Any functional action (including adding items to cart, punching prices, tendering payment, scanning barcodes, adjusting stock, generating POs, or modifying shop settings) is **strictly blocked** and prompts the user to **Sign In with an Active Subscription**.

### B. Access and Execution Requires Rightful Authentication
Only authenticated users belonging to a tenant organization with an **Active Subscription** (`Enterprise`, `Professional`, or `Starter`) or the platform **Hive Master** can perform operations:

1. **How to Sign In**:
   - Click the **`User Auth`** or **`Sign In`** button in the top navigation header.
   - Enter your registered **Username / Email** and **Password** or **Security PIN**.
   - Alternatively, use **`Google Firebase Auth`** to authenticate with your verified Google account.

2. **Tenant Subscription Tiers**:
   - **Enterprise Franchise** (e.g. *Bluenilla Coffee Roasters Corp*): Full access to Sales, Storeroom, Accounts, HR, Manager, IT, and up to 25 hardware tills.
   - **Professional Business** (e.g. *Artisan Pastry & Sweets Co.*): Full access to Sales, Storeroom, Accounts, Manager, and up to 8 hardware tills.
   - **Starter Retail** (e.g. *Pacific Lifestyle Goods Group*): Full access to Sales POS and Storeroom Inventory, and up to 4 hardware tills.

3. **Hive Master Platform Host (`aqutewavedev@gmail.com`)**:
   - Holds system-wide administrative oversight across all tenant infrastructure.
   - Operates with **read-only integrity** over tenant shop catalogs and sales ledgers.
   - Authorized to generate central backup snapshots and initiate point-in-time disaster recovery for tenants.

> **Security Note**: All developer demo cards, mock user bypass shortcuts, and unauthenticated switching triggers have been permanently removed from the user interface. All access requires authentic database credentials.
