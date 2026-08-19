import { cn } from '@/lib/utils'

interface Props {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base'
}

export default function AppLogo({ className, size = 'md' }: Props) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground',
        sizes[size],
        className
      )}
      aria-hidden
    >
      SK
    </div>
  )
}
