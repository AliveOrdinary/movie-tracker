// src/components/ui/loading-spinner.tsx
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl"
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-3",
  xl: "h-12 w-12 border-4"
}

export function LoadingSpinner({ 
  size = "md", 
  className,
  ...props 
}: LoadingSpinnerProps) {
  return (
    <div 
      role="status"
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-primary",
          "border-r-transparent border-t-transparent",
          sizeClasses[size]
        )}
      />
      <span className="sr-only">Loading...</span>
    </div>
  )
}