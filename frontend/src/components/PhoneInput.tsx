interface Props {
  value: string
  onChange: (value: string) => void
  required?: boolean
  className?: string
  placeholder?: string
  maxLength?: number   // ← Ajouté
}

export function formatCameroonDigits(raw: string, max = 9): string {
  const digits = raw.replace(/\D/g, '').slice(0, max)
  const parts: string[] = []
  if (digits.length > 0) parts.push(digits.slice(0, 3))
  if (digits.length > 3) parts.push(digits.slice(3, 6))
  if (digits.length > 6) parts.push(digits.slice(6, 9))
  return parts.join(' ')
}

export function toFullCameroonPhone(formatted: string): string {
  const digits = formatted.replace(/\D/g, '')
  return digits.length === 9 ? `+237${digits}` : ''
}

export function stripCameroonPrefix(full: string | null | undefined): string {
  if (!full) return ''
  const digits = full.replace(/\D/g, '')
  const local = digits.startsWith('237') ? digits.slice(3) : digits
  return formatCameroonDigits(local)
}

function PhoneInput({
  value,
  onChange,
  required,
  className,
  placeholder = '6XX XXX XXX',
  maxLength = 9
}: Props) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCameroonDigits(e.target.value, maxLength)
    onChange(formatted)
  }

  return (
    <div className="phone-input-wrap">
      <span className="phone-input-prefix">+237</span>
      <input
        className={className}
        type="tel"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        inputMode="numeric"
        maxLength={13} // +237 + 9 chiffres + espaces
      />
    </div>
  )
}

export default PhoneInput