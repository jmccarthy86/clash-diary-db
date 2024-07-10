import * as React from "react"
import { addDays, format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerWithRangeProps {
  className?: string;
  date: { from: Date; to: Date };
  setDate: (date: { from: Date; to: Date }) => void;
}

export default function DatePickerWithRange({
  className,
  date,
  setDate
}: DatePickerWithRangeProps) {
  const [internalDate, setInternalDate] = React.useState<DateRange>({ 
    from: date.from, 
    to: date.to 
  });

  React.useEffect(() => {
    setInternalDate({ from: date.from, to: date.to });
  }, [date]);

  const handleSelect = (newDate: DateRange | undefined) => {
    if (newDate?.from) {
      setInternalDate(newDate);
      if (newDate.to) {
        setDate({ from: newDate.from, to: newDate.to });
      } else {
        setDate({ from: newDate.from, to: newDate.from });
      }
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "lg:w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {internalDate.from ? (
              internalDate.to ? (
                <>
                  {format(internalDate.from, "LLL dd, y")} -{" "}
                  {format(internalDate.to, "LLL dd, y")}
                </>
              ) : (
                format(internalDate.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={internalDate.from}
            selected={internalDate}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}