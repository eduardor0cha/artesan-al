import { Button } from '@/presentation/components/ui/button'
import { buildWhatsAppHref } from '@/presentation/lib/whatsapp'
import { messages } from '@/presentation/messages/pt-BR'

type WhatsAppButtonProps = {
  phone: string
  /** Already written for the artisan, so the visitor only has to press send. */
  message: string
  className?: string
}

/**
 * The one action every public page leads to. This system divulges craft rather than selling it
 * (ADR 0011), so the conversation happens on WhatsApp, where this audience already is.
 */
export function WhatsAppButton({ phone, message, className }: WhatsAppButtonProps) {
  return (
    <Button asChild size="large" className={className}>
      <a href={buildWhatsAppHref(phone, message)} target="_blank" rel="noopener noreferrer">
        {messages.whatsApp.talk}
      </a>
    </Button>
  )
}
