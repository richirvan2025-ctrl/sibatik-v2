"use client"

import * as React from "react"
import { format, parse, isValid, startOfDay } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { CalendarClock, Clock, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Format nilai internal mengikuti input datetime-local: "yyyy-MM-dd'T'HH:mm"
const VALUE_FORMAT = "yyyy-MM-dd'T'HH:mm"

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
const MINUTES = ["00", "30"]

function parseValue(value?: string): Date | undefined {
  if (!value) return undefined
  const parsed = parse(value, VALUE_FORMAT, new Date())
  if (isValid(parsed)) return parsed
  const fallback = new Date(value)
  return isValid(fallback) ? fallback : undefined
}

export interface DateTimePickerProps {
  value?: string
  onChange: (value: string) => void
  /** Batas tanggal minimum (format "yyyy-MM-dd'T'HH:mm" atau ISO). */
  min?: string
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DateTimePicker({
  value,
  onChange,
  min,
  placeholder = "Pilih tanggal & jam",
  disabled,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  const selected = parseValue(value)
  const minDate = parseValue(min)

  const hour = selected ? String(selected.getHours()).padStart(2, "0") : "23"
  const minute = selected
    ? selected.getMinutes() >= 30
      ? "30"
      : "00"
    : "00"

  const emit = (date: Date) => {
    onChange(format(date, VALUE_FORMAT))
  }

  const handleSelectDate = (date?: Date) => {
    if (!date) return
    const next = new Date(date)
    next.setHours(Number(hour), Number(minute), 0, 0)
    emit(next)
  }

  const handleTimeChange = (nextHour: string, nextMinute: string) => {
    const base = selected ?? new Date()
    const next = new Date(base)
    next.setHours(Number(nextHour), Number(nextMinute), 0, 0)
    emit(next)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
  }

  const label = selected
    ? format(selected, "EEE, d MMM yyyy · HH:mm", { locale: idLocale })
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <button
            type="button"
            className={cn(
              "flex h-10 w-full items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm transition-colors focus:bg-white focus:border-[#7C3AED] focus:outline-none data-[popup-open]:bg-white data-[popup-open]:border-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
          >
            <CalendarClock className="h-4 w-4 shrink-0 text-[#7C3AED]" />
            <span
              className={cn(
                "flex-1 truncate text-left",
                selected ? "text-[#1E293B]" : "text-[#94A3B8]"
              )}
            >
              {label}
            </span>
            {selected && (
              <span
                role="button"
                tabIndex={-1}
                onClick={handleClear}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
          </button>
        }
      />
      <PopoverContent className="p-0">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={handleSelectDate}
          disabled={minDate ? { before: startOfDay(minDate) } : undefined}
          autoFocus
        />
        <div className="flex items-center gap-2 border-t border-[#E2E8F0] p-3">
          <Clock className="h-4 w-4 shrink-0 text-[#7C3AED]" />
          <span className="text-xs font-medium text-[#64748B]">Jam</span>
          <div className="ml-auto flex items-center gap-1.5">
            <Select value={hour} onValueChange={(v) => handleTimeChange(v || hour, minute)}>
              <SelectTrigger className="h-9 w-16 rounded-lg border-[#E2E8F0] bg-[#F8FAFC] text-sm">
                <SelectValue>{hour}</SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-52">
                {HOURS.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm font-semibold text-[#94A3B8]">:</span>
            <Select value={minute} onValueChange={(v) => handleTimeChange(hour, v || minute)}>
              <SelectTrigger className="h-9 w-16 rounded-lg border-[#E2E8F0] bg-[#F8FAFC] text-sm">
                <SelectValue>{minute}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MINUTES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
