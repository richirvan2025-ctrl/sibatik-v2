import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-xl border border-input bg-white px-3 py-2.5 text-base shadow-[var(--shadow-inset)] transition-[border-color,box-shadow,background-color] duration-200 outline-none placeholder:text-[#8B96AC] focus-visible:border-ring focus-visible:ring-0 focus-visible:shadow-[var(--shadow-focus)] disabled:cursor-not-allowed disabled:bg-input/20 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-0 aria-invalid:shadow-[0_0_0_3px_rgba(229,72,77,0.12)] md:text-sm motion-reduce:transition-none dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
