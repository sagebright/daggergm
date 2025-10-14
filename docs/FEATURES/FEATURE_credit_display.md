# FEATURE: Credit Display System

**Purpose**: Implement a transparent and trustworthy credit display system that shows users their balance, costs, and purchase options following ethical design principles.

**Priority**: MEDIUM - Core monetization UX

---

## 📋 **Requirements**

### Credit Display Components

- Persistent balance indicator
- Clear cost indicators before actions
- Purchase flow integration
- Transaction history access
- Low balance warnings
- Guest mode limitations

### Visual Requirements

- Non-intrusive placement
- Clear numerical display
- Color coding for states
- Animated balance changes
- Mobile-optimized layout

### Ethical Design Principles

- No dark patterns
- Transparent pricing
- Easy cancellation
- Clear value proposition
- No pressure tactics

---

## 🎯 **Success Criteria**

1. Credit balance always visible
2. Costs shown before actions
3. Purchase flow < 3 clicks
4. No deceptive patterns
5. Accessibility compliant
6. Guest users see clear limits

---

## 📐 **Technical Implementation**

### Component Structure

```
components/
  features/
    credits/
      CreditBalance.tsx
      CreditCost.tsx
      PurchaseModal.tsx
      TransactionHistory.tsx
      useCreditBalance.ts
```

### Credit Balance Component

```tsx
interface CreditBalanceProps {
  variant?: 'default' | 'compact' | 'detailed'
  showPurchaseButton?: boolean
  animate?: boolean
}

export function CreditBalance({
  variant = 'default',
  showPurchaseButton = true,
  animate = true,
}: CreditBalanceProps) {
  const { balance, isLoading } = useCreditBalance()

  return (
    <div className="flex items-center gap-2">
      <CoinIcon className="h-4 w-4 text-dagger-gold-400" />
      <span className={cn('font-medium', animate && 'transition-all duration-300')}>{balance}</span>
      {showPurchaseButton && balance < 5 && (
        <Button size="sm" variant="ghost">
          Add Credits
        </Button>
      )}
    </div>
  )
}
```

### Cost Indicator Pattern

```tsx
export function CreditCost({ action, cost = 1 }: { action: string; cost?: number }) {
  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      <CoinIcon className="h-3 w-3" />
      <span>
        {cost} credit{cost !== 1 ? 's' : ''}
      </span>
      <span>to {action}</span>
    </div>
  )
}
```

---

## 🧪 **Test Requirements**

### Unit Tests

- Balance display accuracy
- Cost calculation logic
- Animation triggers
- Purchase flow states

### Integration Tests

- Real-time balance updates
- Transaction processing
- Error state handling
- Guest mode restrictions

### UX Tests

- Purchase flow completion time
- Clarity of pricing
- Mobile usability
- Accessibility compliance

---

## 📊 **Phase Breakdown**

### Phase 1: Balance Display

1. Create CreditBalance component
2. Implement balance hook
3. Add to navigation/header
4. Test real-time updates

### Phase 2: Cost Indicators

1. Build CreditCost component
2. Add to generation buttons
3. Implement warning states
4. Guest mode messages

### Phase 3: Purchase Flow

1. Create purchase modal
2. Integrate Stripe elements
3. Add confirmation steps
4. Success/error handling

### Phase 4: Polish & Ethics

1. Add transaction history
2. Implement animations
3. Ethical design audit
4. A/B test messaging

---

## 🚨 **Risk Mitigation**

- **Risk**: Users feel pressured to buy
  - **Mitigation**: Subtle indicators, no popups
- **Risk**: Confusion about costs
  - **Mitigation**: Clear pricing everywhere

- **Risk**: Purchase flow friction
  - **Mitigation**: Minimal steps, saved cards

---

## 📝 **Implementation Notes**

### Placement Guidelines

1. **Header**: Compact balance display
2. **Generation buttons**: Inline cost
3. **Empty state**: Purchase prompt
4. **Settings**: Detailed history

### Animation Guidelines

- Balance changes: 300ms ease-out
- Pulse on low balance (< 3)
- Celebrate on purchase
- No annoying animations

### Guest Mode Messaging

```typescript
const GUEST_MESSAGES = {
  welcome: 'Try one free adventure!',
  used: 'Sign up for more adventures',
  generate: '1 free adventure remaining',
}
```

### Ethical Considerations

1. Never hide costs
2. No fake urgency
3. Easy unsubscribe
4. Clear refund policy
5. Honest value prop

### Mobile Optimizations

- Thumb-friendly purchase button
- Swipe for history
- Compact mode default
- Native payment sheets

---

**Estimated Time**: 5-6 hours
**Dependencies**: Stripe integration, Supabase functions
**Blocked By**: Backend credit system

---

## 🎬 **Next Steps After Completion**

1. Analytics for conversion optimization
2. Referral credit system
3. Bulk purchase discounts
4. Team/subscription plans
