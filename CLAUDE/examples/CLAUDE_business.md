# 💼 TCG Business Domain Knowledge

## 🃏 Core Business Understanding

### **What This System Does**

This is a **card reselling business management system** for Pokémon card dealers who:

- Buy cards from customers (trade-ins)
- Identify and price cards accurately
- Manage inventory efficiently
- Generate quotes for bulk purchases
- Track sales and profit margins

### **User Workflow**

1. **Card Intake**: Customer brings cards → Photo/scan → OCR identification
2. **Pricing**: System looks up market values → Calculates trade-in offers
3. **Quote Generation**: Create official purchase quote with terms
4. **Inventory Management**: Track acquired cards, condition, location
5. **Sales Tracking**: Monitor what sells, profit margins, trends

## 🔍 OCR Development Guidelines (Randy's Team)

### **CRITICAL WARNING**

The `ocrService.js` file is **2000+ lines** with complex, interdependent pattern matching rules. Changes must be made carefully to avoid breaking existing functionality.

### **Pattern Management Rules**

- ✅ **ADD patterns incrementally** - prefer adding over modifying
- ❌ **NEVER modify existing patterns** without understanding dependencies
- 🧪 **TEST thoroughly** - OCR changes affect entire system accuracy
- 📝 **DOCUMENT pattern purposes** - comment why patterns exist

### **Safe vs Dangerous Approaches**

```javascript
// ✅ SAFE: Adding new exclusion pattern
const exclusionPatterns = [
  ...existingPatterns,
  /BASIG/gi, // New pattern for specific card issue
]

// ❌ DANGEROUS: Replacing entire exclusion array
const exclusionPatterns = [
  /BASIG/gi, // This removes all existing patterns!
]

// ✅ SAFE: Adding to commonOcrFixes object
commonOcrFixes = {
  ...commonOcrFixes,
  BASIG: 'BASIC', // Add new correction
}

// ❌ DANGEROUS: Overwriting commonOcrFixes
commonOcrFixes = {
  BASIG: 'BASIC', // This removes all existing fixes!
}
```

### **OCR Change Workflow**

1. **Read entire pattern section** before making changes
2. **Test existing cards** that might be affected by your change
3. **Add pattern incrementally** using spread operators or push methods
4. **Test both new AND existing card recognition** after changes
5. **Document your change** with inline comments explaining the specific card issue

### **Critical OCR Areas**

- `commonOcrFixes` object (line ~1612) - text correction mappings
- Exclusion patterns (line ~1668) - filters out false positive text
- Set name corrections - many cards rely on these mappings
- Pokemon name standardization - affects database matching

### **Emergency Recovery**

- If changes break existing recognition, immediately revert your specific changes
- Use git to identify exactly what was modified: `git diff HEAD~1 backend/src/services/ocrService.js`
- Contact main development team if patterns seem corrupted

### **OCR Testing Protocol**

- Test at least 3 different card types after any OCR change
- Verify that previously working cards still work correctly
- Check console logs for new OCR processing errors

## 💰 Trade-in Rate Business Logic

### **Rate Configuration**

- **Cash Rates**: Typically 70-80% of market value
- **Store Credit Rates**: Typically 85-95% of market value
- **Configurable per tenant** via Admin Tools
- **Live preview** shows calculations for different market prices

### **Rate Integration**

```javascript
// Rates are automatically used in pricing calculations
const cashOffer = marketPrice * (tenantRates.cash_rate / 100)
const creditOffer = marketPrice * (tenantRates.store_credit_rate / 100)
```

## 🏢 Multi-Tenancy Business Model

### **Customer Structure**

- Each **customer** = one tenant (card shop/dealer)
- **Tenant isolation** - customers can't see each other's data
- **Role hierarchy**: user → admin → super_admin
- **Super admins** can view aggregate data across all customers

### **Admin Tools Features**

- **User Management**: Full CRUD operations within tenant
- **Role Assignment**: Manage user permissions
- **Trade-in Rate Configuration**: Set pricing percentages
- **Data Analytics**: View tenant-specific performance

## 📊 Performance Expectations

### **User Experience Requirements**

- **Card identification**: < 3 seconds after photo upload
- **Pricing lookup**: < 1 second for market values
- **Quote generation**: < 5 seconds for bulk quotes
- **Search/filtering**: < 2 seconds for inventory queries

### **Data Accuracy Requirements**

- **OCR accuracy**: > 85% for common cards
- **Price accuracy**: Within 10% of current market value
- **Inventory tracking**: 100% accuracy for quantities/locations

## 🎯 Business Metrics That Matter

### **Key Performance Indicators**

- **Cards processed per day** (volume indicator)
- **Average trade-in value** (business size indicator)
- **OCR accuracy rate** (operational efficiency)
- **Quote conversion rate** (sales effectiveness)
- **Profit margins per transaction** (profitability)

### **Seasonal Considerations**

- **Holiday seasons**: Higher card volumes, pricing volatility
- **New set releases**: Price fluctuations, identification challenges
- **Tournament seasons**: Specific card demand spikes

---

**Version**: 2025-08-01
