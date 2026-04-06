# 🎨 Company Branding System - Implementation Guide

## ✅ **PHASE B COMPLETED: Tenant-Specific Company Branding**

The Blumebyte platform now has a **SuperAdmin-controlled company branding system** where each company can customize their name, logo, and brand colors that affect all users in their company only.

---

## 🏗️ **System Architecture**

### **1. Branding Context** (`/lib/branding-context.tsx`)
- Already tenant-isolated (loads from `company-settings:${companyId}`)
- Provides `branding.companyName`, `branding.logoUrl`, `branding.primaryColor`
- Auto-refreshes every 60 seconds and on custom events

### **2. Backend Endpoints** (`/supabase/functions/server/index.tsx`)
- ✅ `PUT /superadmin/company-branding` - SuperAdmin updates branding (NEW)
- ✅ `POST /upload/company-logo` - SuperAdmin uploads logo (RESTRICTED)
- ✅ `DELETE /superadmin/remove-company-logo` - SuperAdmin removes logo (NEW)
- ✅ `GET /company-settings` - All users get their company's branding
- ✅ Legacy `PUT /admin/company-settings` - Kept for backward compatibility

### **3. CompanyBrandingSettings Component** (`/components/CompanyBrandingSettings.tsx`)
- SuperAdmin-only UI for managing branding
- Logo upload with circular crop tool
- Company name, description, and color picker
- Live preview of branding changes
- Added to SuperAdmin Dashboard → Settings → Billings & Subscriptions

### **4. Tenant Isolation**
- Each company's branding stored in `company-settings:${companyId}`
- Changes by SuperAdmin of Company A don't affect Company B
- PDFs, emails, and UI all use dynamic branding

---

## 📖 **How to Use Branding in Components**

### **Method 1: Using the Hook**

```tsx
import { useBranding } from '../lib/branding-context';

export function MyComponent() {
  const { branding } = useBranding();
  
  return (
    <div>
      <h1>{branding.companyName}</h1>
      {/* Output: "Your Company Name" not "Blumebyte" */}
      
      <img src={branding.logoUrl} alt="Company Logo" />
      
      <div style={{ color: branding.primaryColor }}>
        Branded content
      </div>
    </div>
  );
}
```

### **Method 2: In PDF Exports**

```tsx
import { useBranding } from '../lib/branding-context';

function MyComponent() {
  const { branding } = useBranding();
  
  const exportPDF = () => {
    const content = `
      <h1>${branding.companyName} - Report</h1>
      <p>Generated on ${new Date().toLocaleString()}</p>
      <!-- Use branding.companyName instead of "Blumebyte" -->
    `;
    // ... export logic
  };
}
```

---

## 🔍 **Components with Hardcoded "Blumebyte"**

### **✅ Already Using Dynamic Branding**
- ✅ `SharedMyProfile.tsx` - PDFs use `branding.companyName`
- ✅ `CompanyBrandingSettings.tsx` - New component for SuperAdmin
- ✅ `ReportsPanel.tsx` - Has parameter for company name

### **🔄 Needs Migration (High Priority)**
- [ ] `LoginPage.tsx` - Hardcoded "Blumebyte" in multiple places
- [ ] `AuditLogsModule.tsx` - PDF exports use 'Blumebyte HR'
- [ ] `EmployeeDashboard.tsx` - PDF exports (if any)

### **⚠️ Special Cases (Low Priority)**
- [ ] `TimeTrackingModule.tsx` - Sample data uses "Blumebyte"
- [ ] `TrainingModule.tsx` - Sample data uses "Blumebyte Training"
- [ ] `HRAIAssistant.tsx` - Toast messages reference "Blumebyte"
- [ ] `EmployeeChat.tsx` - Header shows "Blumebyte Chat"
- [ ] `HomepageChatAgent.tsx` - FAQ responses mention "Blumebyte"

### **❌ Should NOT Change (Public/Marketing)**
These files are for the public website and should keep "Blumebyte":
- ✅ All landing pages (`LandingPage.tsx`, `FeaturesPage.tsx`, etc.)
- ✅ Pricing page
- ✅ Marketing materials

---

## 🔄 **Migration Guide: Replacing Hardcoded Branding**

### **Example: Login Page**

**❌ BEFORE:**
```tsx
<h1>Welcome to Blumebyte</h1>
<p>© 2024 Blumebyte HRIS</p>
```

**✅ AFTER:**
```tsx
import { useBranding } from '../lib/branding-context';

function LoginPage() {
  const { branding } = useBranding();
  
  return (
    <>
      <h1>Welcome to {branding.companyName}</h1>
      <p>© 2024 {branding.companyName} HRIS</p>
    </>
  );
}
```

### **Example: PDF Export with Currency**

**❌ BEFORE:**
```tsx
const pdf = `
  <h1>Blumebyte - Payslip</h1>
  <p>Salary: GHS ${amount}</p>
`;
```

**✅ AFTER:**
```tsx
import { useBranding } from '../lib/branding-context';
import { useCurrency } from '../lib/currency-context';

function MyComponent() {
  const { branding } = useBranding();
  const { formatCurrency } = useCurrency();
  
  const pdf = `
    <h1>${branding.companyName} - Payslip</h1>
    <p>Salary: ${formatCurrency(amount)}</p>
  `;
}
```

---

## 🛠️ **Implementation Checklist**

### **✅ Completed**
- [x] Created CompanyBrandingSettings component
- [x] Added SuperAdmin-only backend endpoints
- [x] Restricted logo upload to SuperAdmin
- [x] Added component to SuperAdmin Dashboard
- [x] Branding context already tenant-isolated
- [x] PDFs in SharedMyProfile use dynamic company name

### **🚧 Remaining Tasks**
- [ ] Migrate LoginPage.tsx to use dynamic branding
- [ ] Update AuditLogsModule.tsx PDF exports
- [ ] Find and replace remaining hardcoded "Blumebyte" in user-facing components
- [ ] Test multi-tenant isolation (Company A sees their branding, Company B sees theirs)
- [ ] Update toast messages to use dynamic company name
- [ ] Update chat headers to use dynamic company name

### **📋 Testing Required**
- [ ] SuperAdmin uploads logo → appears for all users in that company
- [ ] SuperAdmin changes company name → PDFs show new name
- [ ] SuperAdmin changes color → UI updates with new color
- [ ] Company A changes don't affect Company B
- [ ] PDF exports show correct company name and currency
- [ ] Login page shows company logo (if uploaded)

---

## 🔍 **Finding Hardcoded Branding in Code**

Use these search patterns to find remaining instances:

```bash
# Find hardcoded "Blumebyte" (case-sensitive)
grep -r "Blumebyte" components/ --include="*.tsx"

# Find hardcoded company names in strings
grep -r "'.*Company.*'" components/ --include="*.tsx"

# Find PDF exports that might use hardcoded names
grep -r "exportToPDF\|printReport" components/ --include="*.tsx"
```

---

## 🚨 **Common Pitfalls**

### **1. Don't use hardcoded company names**
```tsx
// ❌ BAD
<h1>Welcome to Blumebyte</h1>

// ✅ GOOD
<h1>Welcome to {branding.companyName}</h1>
```

### **2. Don't forget PDF exports**
```tsx
// ❌ BAD
const pdfContent = `<h1>Blumebyte Report</h1>`;

// ✅ GOOD
const { branding } = useBranding();
const pdfContent = `<h1>${branding.companyName} Report</h1>`;
```

### **3. Don't modify public pages**
```tsx
// ✅ CORRECT - Keep "Blumebyte" on landing page
<h1>Welcome to Blumebyte</h1> // This is marketing, not tenant-specific
```

### **4. Combine with Currency for financial displays**
```tsx
// ✅ PERFECT - Both branding AND currency are dynamic
const { branding } = useBranding();
const { formatCurrency } = useCurrency();

const report = `
  <h1>${branding.companyName} - Financial Report</h1>
  <p>Total Revenue: ${formatCurrency(revenue)}</p>
`;
```

---

## 📊 **Impact Summary**

### **What Changes for Tenants:**
1. ✅ **Company Name** - Replaces "Blumebyte" everywhere in their dashboard
2. ✅ **Company Logo** - Shows in navigation, PDFs, emails
3. ✅ **Brand Colors** - Primary color affects UI elements
4. ✅ **PDF Exports** - Show tenant's company name, not "Blumebyte"
5. ✅ **Complete Isolation** - Each tenant sees only their branding

### **What Stays the Same:**
1. ✅ Public landing pages still say "Blumebyte"
2. ✅ Marketing materials unchanged
3. ✅ Core functionality unchanged
4. ✅ Other tenants see their own branding

---

## 🎉 **Benefits**

✅ **White-Label Ready** - Companies can fully brand the system as their own  
✅ **Multi-Tenant Isolation** - Each company has separate branding  
✅ **SuperAdmin Control** - Only SuperAdmin can change branding  
✅ **Professional PDFs** - Reports show company logo and name  
✅ **Seamless Integration** - Works with existing currency system  

---

## 📞 **Files Modified**

### **Created:**
- `/components/CompanyBrandingSettings.tsx` - New branding UI
- `/BRANDING_SYSTEM.md` - This documentation

### **Updated:**
- `/supabase/functions/server/index.tsx` - Added SuperAdmin endpoints
- `/components/SuperAdminDashboard.tsx` - Added branding section
- `/lib/branding-context.tsx` - Already existed, no changes needed

### **Needs Update:**
- `/components/LoginPage.tsx` - Replace hardcoded "Blumebyte"
- `/components/AuditLogsModule.tsx` - Use dynamic company name in PDFs
- Other components with hardcoded references (see list above)

---

**Last Updated:** April 6, 2026  
**Status:** Phase B Complete ✅ | Migration In Progress 🚧
