# 💱 Global Currency System - Implementation Guide

## ✅ **PHASE A COMPLETED: Tenant-Specific Currency Management**

The Blumebyte platform now has a **tenant-isolated global currency system** where each company can set their own currency that affects all monetary displays for their users only.

---

## 🏗️ **System Architecture**

### **1. Currency Context Provider** (`/lib/currency-context.tsx`)
- Loads currency from the tenant's company record in KV store
- Provides `formatCurrency()`, `currencySymbol`, `currencyCode` 
- Automatically updates when SuperAdmin changes currency

### **2. Backend Currency Endpoint** (`/supabase/functions/server/index.tsx`)
- `PUT /companies/:id/currency` - Updates company currency
- Validates currency codes (15 supported currencies)
- Enforces tenant isolation (users can only update their own company)

### **3. GlobalCurrencySettings Component** (`/components/GlobalCurrencySettings.tsx`)
- SuperAdmin UI to select currency
- Saves to company record (not localStorage)
- Triggers app reload to apply changes everywhere

### **4. Supported Currencies**
```typescript
USD ($), EUR (€), GBP (£), NGN (₦), GHS (₵), ZAR (R), KES (KSh),
CAD (C$), AUD (A$), INR (₹), JPY (¥), CNY (¥), CHF (Fr), AED (د.إ), SAR (﷼)
```

---

## 📖 **How to Use Currency in Components**

### **Method 1: Using the Hook (Recommended)**

```tsx
import { useCurrency } from '../lib/currency-context';

export function MyComponent() {
  const { formatCurrency, currencySymbol, currencyCode } = useCurrency();
  
  return (
    <div>
      <p>Salary: {formatCurrency(5000)}</p>
      {/* Output: $5,000.00 or ₦5,000.00 depending on tenant */}
      
      <p>Symbol: {currencySymbol}</p>
      {/* Output: $ or ₦ etc */}
      
      <Input placeholder={`Amount in ${currencyCode}`} />
      {/* Output: Amount in USD or Amount in NGN */}
    </div>
  );
}
```

### **Method 2: Context Consumer (for class components)**

```tsx
import { CurrencyContext } from '../lib/currency-context';

class MyComponent extends React.Component {
  static contextType = CurrencyContext;
  
  render() {
    const { formatCurrency } = this.context;
    return <div>{formatCurrency(1000)}</div>;
  }
}
```

---

## 🔄 **Migration Guide: Replacing Hardcoded Currency**

### **❌ BEFORE (Hardcoded)**
```tsx
// Bad: Hardcoded $ symbol
<p>Salary: ${employee.salary}</p>
<p>Total: GHS {total.toLocaleString()}</p>
```

### **✅ AFTER (Dynamic)**
```tsx
import { useCurrency } from '../lib/currency-context';

function MyComponent() {
  const { formatCurrency, currencySymbol } = useCurrency();
  
  return (
    <>
      <p>Salary: {formatCurrency(employee.salary)}</p>
      <p>Total: {formatCurrency(total)}</p>
    </>
  );
}
```

---

## 🎯 **Components That Need Migration**

The following components have hardcoded currency symbols and need to be updated:

### **High Priority (User-Facing)**
- [ ] `/components/SharedMyProfile.tsx` - Hardcoded "GHS" in payslips
- [ ] `/components/EmployeeDashboard.tsx` - Hardcoded "GHS" in payslips  
- [ ] `/components/PayrollModule.tsx` - Hardcoded "$" symbols
- [ ] `/components/CompensationModule.tsx` - Hardcoded currency
- [ ] `/components/PayGradesModule.tsx` - Shows currency field per grade
- [ ] `/components/portal/OvertimeExpenseTab.tsx` - Has formatCurrency prop

### **Medium Priority (Admin/Reports)**
- [ ] All report generation components
- [ ] PDF export functions
- [ ] CSV export functions
- [ ] Dashboard analytics with financial data

### **Low Priority (Configuration)**
- [ ] Tax configuration displays
- [ ] Financial year displays
- [ ] Budget/forecast modules

---

## 🛠️ **Implementation Checklist**

### **✅ Completed**
- [x] Created CurrencyContext with tenant isolation
- [x] Added CurrencyProvider to routes.tsx
- [x] Created backend endpoint `/companies/:id/currency`
- [x] Updated GlobalCurrencySettings to use tenant storage
- [x] Fixed Financial Years routes (`/admin/financial-years`)
- [x] Fixed Tax Configuration routes (`/admin/tax-configurations`)

### **🚧 In Progress (Next Steps)**
- [ ] Migrate SharedMyProfile.tsx payslip displays
- [ ] Migrate EmployeeDashboard.tsx payslip displays
- [ ] Create global search/replace for hardcoded "$" in JSX
- [ ] Update all PDF export functions
- [ ] Update all CSV export functions

### **📋 Testing Required**
- [ ] Test currency change applies to all modules
- [ ] Test multi-tenant isolation (Company A sees USD, Company B sees NGN)
- [ ] Test currency persists after logout/login
- [ ] Test PDF exports show correct currency
- [ ] Test CSV exports show correct currency

---

## 🔍 **Finding Hardcoded Currency in Code**

Use these search patterns to find hardcoded currency:

```bash
# Find hardcoded $ symbols in JSX
grep -r "\$\{" components/ --include="*.tsx"

# Find hardcoded currency codes
grep -r "GHS\|USD\|NGN\|EUR" components/ --include="*.tsx"

# Find toLocaleString without currency formatting
grep -r "toLocaleString()" components/ --include="*.tsx"
```

---

## 🚨 **Common Pitfalls**

### **1. Don't use localStorage for currency**
```tsx
// ❌ BAD: Uses localStorage (global, not tenant-specific)
const symbol = localStorage.getItem('global_currency_symbol');

// ✅ GOOD: Uses context (tenant-specific)
const { currencySymbol } = useCurrency();
```

### **2. Don't hardcode currency in server responses**
```tsx
// ❌ BAD: Server returns hardcoded currency
return { amount: 1000, display: '$1,000' };

// ✅ GOOD: Server returns raw amount, client formats
return { amount: 1000 }; // Client will format based on tenant
```

### **3. Don't forget PDF/CSV exports**
```tsx
// ❌ BAD: Hardcoded in export
const csv = `Salary,$${employee.salary}`;

// ✅ GOOD: Use formatCurrency in exports
const { formatCurrency } = useCurrency();
const csv = `Salary,${formatCurrency(employee.salary)}`;
```

---

## 📊 **Testing Multi-Tenant Isolation**

1. **Login as SuperAdmin of Company A**
   - Go to Settings → Currency
   - Select USD ($)
   - Save changes

2. **Login as SuperAdmin of Company B**
   - Go to Settings → Currency
   - Select NGN (₦)
   - Save changes

3. **Verify Isolation**
   - Company A users see $ everywhere
   - Company B users see ₦ everywhere
   - No cross-contamination

---

## 🎉 **Benefits**

✅ **Tenant Isolation** - Each company has their own currency
✅ **Global Application** - One change affects entire tenant dashboard
✅ **15 Currencies** - Support for major world currencies
✅ **Automatic Formatting** - Consistent formatting with commas and decimals
✅ **Easy Migration** - Simple hook-based API

---

## 📞 **Support**

For questions about currency implementation, check:
- `/lib/currency-context.tsx` - Context implementation
- `/lib/currency-utils.ts` - Utility functions
- `/components/GlobalCurrencySettings.tsx` - Settings UI

---

**Last Updated:** April 6, 2026  
**Status:** Phase A Complete ✅ | Phase B (Branding) Next 🚧
