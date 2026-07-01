interface Props {
  value: string
  onChange: (value: string) => void
  required?: boolean
  className?: string
  placeholder?: string
}

export function formatCameroonDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 9)
  const parts: string[] = []
  if (digits.length > 0) parts.push(digits.slice(0, 3))
  if (digits.length > 3) parts.push(digits.slice(3, 5))
  if (digits.length > 5) parts.push(digits.slice(5, 7))
  if (digits.length > 7) parts.push(digits.slice(7, 9))
  return parts.join(' ')
}

export function toFullCameroonPhone(formatted: string): string {
  const digits = formatted.replace(/\D/g, '')
  return digits ? `+237 ${formatted}` : ''
}

export function stripCameroonPrefix(full: string | null | undefined): string {
  if (!full) return ''
  const digits = full.replace(/\D/g, '')
  const local = digits.startsWith('237') ? digits.slice(3) : digits
  return formatCameroonDigits(local)
}

function PhoneInput({ value, onChange, required, className, placeholder }: Props) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(formatCameroonDigits(e.target.value))
  }

  return (
    <div className="phone-input-wrap">
      <span className="phone-input-prefix">+237</span>
      <input
        className={className}
        type="tel"
        value={value}
        onChange={handleChange}
        placeholder={placeholder ?? '6XX XX XX XX'}
        required={required}
        inputMode="numeric"
        maxLength={11}
      />
    </div>
  )
}

export default PhoneInput