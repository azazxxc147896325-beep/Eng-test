type ProgressBarProps = { value: number; label: string }

export function ProgressBar({ value, label }: ProgressBarProps) {
  const normalized = Math.max(0, Math.min(100, value))
  return (
    <div className="progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={normalized}>
      <div className="progress-value" style={{ width: `${normalized}%` }} />
    </div>
  )
}
