"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ChartContainerProps {
  children: React.ReactNode
  config: Record<string, any>
  className?: string
}

export function ChartContainer({
  children,
  config,
  className,
}: ChartContainerProps) {
  return (
    <div className={cn("w-full", className)}>
      {children}
    </div>
  )
}

export function ChartTooltip({ children, ...props }: React.PropsWithChildren<any>) {
  return <div {...props}>{children}</div>
}

export function ChartTooltipContent({ children, ...props }: React.PropsWithChildren<any>) {
  return <div {...props}>{children}</div>
}

