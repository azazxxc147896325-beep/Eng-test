import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & { size?: 'normal' | 'large' }
>

export function Button({ children, className = '', size = 'normal', ...props }: ButtonProps) {
  return (
    <button
      className={`button button-primary ${size === 'large' ? 'button-large' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}
