import { createContext, useContext, useState, type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabs() {
  const context = useContext(TabsContext)
  if (!context) throw new Error('Tabs components must be used within a Tabs provider')
  return context
}

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue: string
  value?: string
  onValueChange?: (value: string) => void
  children: ReactNode
}

function Tabs({ defaultValue, value, onValueChange, children, className, ...props }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const currentValue = value ?? internalValue
  const handleChange = onValueChange ?? setInternalValue

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleChange }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

function TabsList({ children, className, ...props }: TabsListProps) {
  return (
    <div
      className={cn(
        'inline-flex h-10 items-center justify-start gap-1 rounded-lg bg-[rgb(var(--muted))] p-1',
        className
      )}
      role="tablist"
      {...props}
    >
      {children}
    </div>
  )
}

interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string
  children: ReactNode
  disabled?: boolean
}

function TabsTrigger({ value, children, className, disabled, ...props }: TabsTriggerProps) {
  const { value: currentValue, onValueChange } = useTabs()
  const isActive = currentValue === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => onValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]',
        'disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'bg-[rgb(var(--background))] text-[rgb(var(--foreground))] shadow-sm'
          : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--background)/0.5)]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string
  children: ReactNode
}

function TabsContent({ value, children, className, ...props }: TabsContentProps) {
  const { value: currentValue } = useTabs()
  if (currentValue !== value) return null

  return (
    <div
      role="tabpanel"
      className={cn('mt-4 animate-fade-in', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
