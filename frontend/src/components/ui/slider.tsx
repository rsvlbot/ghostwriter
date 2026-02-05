import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  showValue?: boolean
}

const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, showValue, value, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {(label || showValue) && (
          <div className="flex items-center justify-between">
            {label && (
              <span className="text-sm text-[rgb(var(--muted-foreground))]">{label}</span>
            )}
            {showValue && (
              <span className="text-sm font-medium tabular-nums">{value}</span>
            )}
          </div>
        )}
        <input
          type="range"
          className={cn(
            'w-full h-2 rounded-full appearance-none cursor-pointer',
            'bg-[rgb(var(--muted))]',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[rgb(var(--primary))] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110',
            '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[rgb(var(--primary))] [&::-moz-range-thumb]:border-0',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          ref={ref}
          value={value}
          {...props}
        />
      </div>
    )
  }
)
Slider.displayName = 'Slider'

export { Slider }
