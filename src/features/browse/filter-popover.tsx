"use client"

import { ChevronDownIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface FilterOption {
  value: string
  label: string
}

export interface FilterOptionGroup {
  heading?: string
  options: FilterOption[]
}

interface FilterPopoverProps {
  /** Name of the filter, e.g. "Genres". */
  label: string
  groups: FilterOptionGroup[]
  selected: readonly string[]
  onChange: (values: string[]) => void
  /** Pick several values (the popover stays open) or just one. */
  multiple?: boolean
  /** Shows a search box above the options. */
  searchPlaceholder?: string
  /** Offer "Clear" to remove the selection (off for the sort). */
  clearable?: boolean
  /** Button text in place of the label, e.g. "Sort: Score". */
  summary?: string
  className?: string
}

/** Plain "contains" matching: cmdk's fuzzy default matches too loosely. */
function containsFilter(value: string, search: string, keywords?: string[]) {
  const haystack = [value, ...(keywords ?? [])].join(" ").toLowerCase()
  return haystack.includes(search.trim().toLowerCase()) ? 1 : 0
}

/** A filter button that opens a list of options, optionally searchable. */
export function FilterPopover({
  label,
  groups,
  selected,
  onChange,
  multiple = false,
  searchPlaceholder,
  clearable = true,
  summary,
  className,
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false)
  const active = selected.length > 0
  const labels = new Map(
    groups.flatMap((group) => group.options.map((o) => [o.value, o.label])),
  )
  const selectedLabel =
    !multiple && selected[0] !== undefined ? labels.get(selected[0]) : undefined

  function toggle(value: string) {
    if (!multiple) {
      onChange(selected.includes(value) && clearable ? [] : [value])
      setOpen(false)
      return
    }
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={active && clearable ? "secondary" : "outline"}
          className={cn(
            "shrink-0 rounded-full",
            active && clearable && "ring-1 ring-primary/50",
            className,
          )}
        >
          {summary ?? selectedLabel ?? label}
          {multiple && active ? (
            <span className="rounded-full bg-primary px-1.5 text-[11px] leading-4 font-semibold text-primary-foreground">
              {selected.length}
              <span className="sr-only"> selected</span>
            </span>
          ) : null}
          <ChevronDownIcon data-icon="inline-end" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command label={label} filter={containsFilter}>
          {searchPlaceholder ? (
            <CommandInput placeholder={searchPlaceholder} />
          ) : null}
          <CommandList className="max-h-80">
            <CommandEmpty>Nothing matches.</CommandEmpty>
            {groups.map((group, index) => (
              <CommandGroup
                key={group.heading ?? index}
                heading={group.heading}
              >
                {group.options.map((option) => {
                  const checked = selected.includes(option.value)
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      keywords={[option.label, group.heading ?? ""]}
                      data-checked={checked}
                      aria-checked={checked}
                      onSelect={() => toggle(option.value)}
                    >
                      {option.label}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
          {clearable && active ? (
            <div className="border-t p-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  onChange([])
                  setOpen(false)
                }}
              >
                Clear {label.toLowerCase()}
              </Button>
            </div>
          ) : null}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
