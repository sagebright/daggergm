'use client'

import { CheckIcon } from 'lucide-react'
import { useState } from 'react'

import { purchaseCredits } from '@/app/actions/credits'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CreditPackage {
  id: 'credits_5' | 'credits_15' | 'credits_30'
  amount: number
  price: number // in cents
  name: string
  perCreditPrice: string
  discount?: string
  isBestValue?: boolean
}

const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'credits_5',
    amount: 5,
    price: 500,
    name: '5 Credits',
    perCreditPrice: '$1.00 per credit',
  },
  {
    id: 'credits_15',
    amount: 15,
    price: 1200,
    name: '15 Credits',
    perCreditPrice: '$0.80 per credit',
    discount: '20% off',
  },
  {
    id: 'credits_30',
    amount: 30,
    price: 2100,
    name: '30 Credits',
    perCreditPrice: '$0.70 per credit',
    discount: '30% off',
    isBestValue: true,
  },
]

interface CreditPurchaseDialogProps {
  open: boolean
  onSuccess: () => void
  onCancel: () => void
}

export function CreditPurchaseDialog({ open, onSuccess, onCancel }: CreditPurchaseDialogProps) {
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePurchase = async (pkg: CreditPackage) => {
    setLoading(true)
    setError(null)

    try {
      const result = await purchaseCredits({
        packageId: pkg.id,
        amount: pkg.amount,
        price: pkg.price,
      })

      if (!result.success) {
        setError(result.error || 'Payment failed')
        setLoading(false)
        return
      }

      // Redirect to Stripe Checkout
      if (!result.url) {
        throw new Error('Checkout URL not received')
      }

      // In Stripe.js v8, redirectToCheckout was removed
      // Use window.location to redirect to checkout URL
      window.location.href = result.url

      // User will be redirected to Stripe - this line won't be reached
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Purchase Credits</DialogTitle>
          <DialogDescription>
            Choose a credit package to continue generating adventures
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <button
              key={pkg.id}
              data-testid={`credit-package-${pkg.id}`}
              className={`relative rounded-lg border p-4 text-left transition-all hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                selectedPackage?.id === pkg.id
                  ? 'border-primary ring-2 ring-primary ring-offset-2'
                  : 'border-gray-200 dark:border-gray-800'
              } ${pkg.isBestValue ? 'ring-2 ring-primary/20' : ''}`}
              onClick={() => setSelectedPackage(pkg)}
              onFocus={() => setSelectedPackage(pkg)}
            >
              {pkg.isBestValue ? (
                <Badge className="absolute -top-3 right-4 bg-primary text-primary-foreground">
                  Best Value
                </Badge>
              ) : null}

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold">{pkg.name}</h3>
                  <p className="text-sm text-muted-foreground">{pkg.perCreditPrice}</p>
                  {pkg.discount ? (
                    <Badge variant="secondary" className="mt-1">
                      {pkg.discount}
                    </Badge>
                  ) : null}
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold">${(pkg.price / 100).toFixed(0)}</div>
                  {selectedPackage?.id === pkg.id && (
                    <CheckIcon className="mt-1 inline-block h-5 w-5 text-primary" />
                  )}
                </div>
              </div>
            </button>
          ))}

          {error ? (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() => selectedPackage && handlePurchase(selectedPackage)}
            disabled={loading || !selectedPackage}
          >
            {loading ? 'Processing...' : `Purchase ${selectedPackage?.amount || 0} Credits`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
