import * as React from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "../../lib/utils"

interface Option {
    value: string
    label: string
}

interface SearchableSelectProps {
    options: Option[]
    value?: string
    onValueChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
}

export function SearchableSelect({
    options,
    value,
    onValueChange,
    placeholder = "Chọn...",
    disabled = false,
    className
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")
    const containerRef = React.useRef<HTMLDivElement>(null)

    const selectedOption = options.find((opt) => opt.value === value)

    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    )

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div className={cn("relative w-full", className)} ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && setOpen(!open)}
                disabled={disabled}
                className={cn(
                    "flex h-11 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm transition-colors",
                    "focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50",
                    open && "ring-1 ring-emerald-500",
                    !selectedOption && "text-muted-foreground"
                )}
            >
                <span className="truncate">
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", open && "rotate-180")} />
            </button>

            {open && (
                <div className="absolute left-0 right-0 z-[100] mt-1 max-h-60 overflow-hidden rounded-md border bg-white shadow-lg animate-in fade-in zoom-in-95 duration-100">
                    <div className="sticky top-0 flex items-center border-b bg-white px-3 py-2">
                        <Search className="mr-2 h-4 w-4 opacity-50" />
                        <input
                            autoFocus
                            className="flex h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            placeholder="Tìm kiếm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="max-h-52 overflow-y-auto p-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    className={cn(
                                        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none hover:bg-emerald-50 hover:text-emerald-900 transition-colors",
                                        value === opt.value && "bg-emerald-50 text-emerald-900 font-medium"
                                    )}
                                    onClick={() => {
                                        onValueChange(opt.value)
                                        setOpen(false)
                                        setSearchTerm("")
                                    }}
                                >
                                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                        {value === opt.value && <Check className="h-4 w-4" />}
                                    </span>
                                    {opt.label}
                                </div>
                            ))
                        ) : (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Không tìm thấy dữ liệu
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
