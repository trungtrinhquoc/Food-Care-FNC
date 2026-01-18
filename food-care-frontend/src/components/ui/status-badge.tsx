import * as React from "react"

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        const variantStyles = {
            default: 'bg-emerald-500 text-white hover:bg-emerald-600',
            secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
            destructive: 'bg-red-500 text-white hover:bg-red-600',
            outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
        }

        return (
            <div
                ref={ref}
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantStyles[variant]} ${className || ""}`}
                {...props}
            />
        )
    }
)
StatusBadge.displayName = "StatusBadge"

export { StatusBadge }
