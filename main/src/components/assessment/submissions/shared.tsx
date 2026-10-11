import type { ReactNode } from 'react'

export function CheckOption({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode }) {
  return <label className="check-option"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{children}</span></label>
}

export function RadioOption({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: ReactNode }) {
  return <label className={`radio-option ${checked ? 'selected' : ''}`}><input type="radio" checked={checked} onChange={onChange} /><span>{children}</span></label>
}
