"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import venues from "@/lib/venues"
import { FormControl } from "@/components/ui/form"
import { UseFormReturn } from "react-hook-form"
import { z } from "zod"
import { FormSchema } from "@/components/bookings/BookingForm"


type SelectVenueProps = {
	form: UseFormReturn<z.infer<typeof FormSchema>>;
	field: {
	  value: string;
	  onChange: (value: string) => void;
	};
  }

export function SelectVenue({ form, field }: SelectVenueProps) {
//   const [open, setOpen] = React.useState(false)
//   const [value, setValue] = React.useState("")

  return (
<Popover>
	<PopoverTrigger asChild>
		<FormControl>
		<Button
			variant="outline"
			role="combobox"
			className={cn(
			"w-[200px] justify-between",
			!field.value && "text-muted-foreground"
			)}
		>
			{field.value
			? venues.find(
				(venue) => venue.value === field.value
				)?.label
			: "Select language"}
			<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
		</Button>
		</FormControl>
	</PopoverTrigger>
	<PopoverContent className="w-[200px] p-0">
		<Command>
		<CommandInput placeholder="Search Venue..." />
		<CommandEmpty>No Venue found.</CommandEmpty>
		<CommandGroup>
			{venues.map((venue) => (
			<CommandItem
				value={venue.label}
				key={venue.value}
				onSelect={() => {
				form.setValue("Venue", venue.value)
				}}
			>
				<Check
				className={cn(
					"mr-2 h-4 w-4",
					venue.value === field.value
					? "opacity-100"
					: "opacity-0"
				)}
				/>
				{venue.label}
			</CommandItem>
			))}
		</CommandGroup>
		</Command>
	</PopoverContent>
</Popover>
  )
}
