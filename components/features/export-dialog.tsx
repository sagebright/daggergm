'use client'

import { useState } from 'react'
import { FileText, FileDown, Gamepad2, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { exportAdventure, type ExportFormat } from '@/app/actions/export'
import { toast } from 'sonner'

interface ExportDialogProps {
  open: boolean
  adventureId: string
  onClose: () => void
}

interface ExportOption {
  format: ExportFormat
  label: string
  description: string
  icon: typeof FileText
}

const exportOptions: ExportOption[] = [
  {
    format: 'markdown',
    label: 'Markdown',
    description: 'Plain text format for easy editing',
    icon: FileText,
  },
  {
    format: 'pdf',
    label: 'PDF Document',
    description: 'Professional PDF for printing',
    icon: FileDown,
  },
  {
    format: 'roll20',
    label: 'Roll20',
    description: 'Import directly into Roll20',
    icon: Gamepad2,
  },
]

export function ExportDialog({ open, adventureId, onClose }: ExportDialogProps) {
  const [loading, setLoading] = useState(false)
  const [loadingFormat, setLoadingFormat] = useState<ExportFormat | null>(null)

  const handleExport = async (format: ExportFormat) => {
    setLoading(true)
    setLoadingFormat(format)

    try {
      const result = await exportAdventure(adventureId, format)

      if (result.success && result.data && result.filename) {
        // Create download link
        const url = URL.createObjectURL(result.data)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 1000)

        toast.success('Adventure exported successfully!')
        onClose()
      } else {
        toast.error(result.error || 'Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export adventure')
    } finally {
      setLoading(false)
      setLoadingFormat(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Adventure</DialogTitle>
          <DialogDescription>Choose your export format</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {exportOptions.map((option) => {
            const Icon = option.icon
            const isLoading = loading && loadingFormat === option.format

            return (
              <Button
                key={option.format}
                variant="outline"
                className="justify-start h-auto py-4"
                disabled={loading}
                onClick={() => handleExport(option.format)}
              >
                {isLoading ? (
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                ) : (
                  <Icon className="mr-3 h-5 w-5" />
                )}
                <div className="text-left">
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {isLoading ? 'Exporting...' : option.description}
                  </div>
                </div>
              </Button>
            )
          })}
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
