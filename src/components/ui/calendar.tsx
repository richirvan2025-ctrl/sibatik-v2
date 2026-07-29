"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { id as idLocale } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={idLocale}
      showOutsideDays={showOutsideDays}
      className={cn("p-1", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "flex flex-col gap-3",
        month_caption: "flex h-9 items-center justify-center px-9",
        caption_label: "text-sm font-semibold capitalize text-[#1E293B]",
        nav: "absolute z-10 flex w-full items-center justify-between px-1",
        button_previous:
          "inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-violet-50 hover:text-[#7C3AED] disabled:pointer-events-none disabled:opacity-40",
        button_next:
          "inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-violet-50 hover:text-[#7C3AED] disabled:pointer-events-none disabled:opacity-40",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-9 text-[0.7rem] font-medium capitalize text-[#94A3B8] pb-1",
        week: "flex w-full mt-0.5",
        day: "h-9 w-9 p-0 text-center text-sm",
        day_button:
          "inline-flex h-9 w-9 items-center justify-center rounded-lg font-normal text-[#1E293B] transition-colors hover:bg-violet-50 hover:text-[#7C3AED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/40 aria-selected:opacity-100",
        selected:
          "[&>button]:bg-[#7C3AED] [&>button]:text-white [&>button]:hover:bg-[#6D28D9] [&>button]:hover:text-white [&>button]:font-semibold",
        today: "[&>button]:ring-1 [&>button]:ring-[#7C3AED]/40",
        outside: "[&>button]:text-[#CBD5E1]",
        disabled: "[&>button]:pointer-events-none [&>button]:text-[#CBD5E1] [&>button]:opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName }) => {
          const Icon = orientation === "left" ? ChevronLeft : ChevronRight
          return <Icon className={cn("h-4 w-4", chevronClassName)} />
        },
      }}
      {...props}
    />
  )
}

export { Calendar }
