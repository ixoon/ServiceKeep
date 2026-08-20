import logoUrl from '@/assets/logo.png'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-12'
}

export default function AppLogo({ className, size = 'md' }: Props) {
  return (
    <img
      src={logoUrl}
      alt=""
      aria-hidden
      className={cn('shrink-0 rounded-lg object-cover', sizes[size], className)}
    />
  )
}
