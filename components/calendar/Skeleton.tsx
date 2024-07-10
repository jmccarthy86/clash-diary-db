import { Skeleton } from "@/components/ui/skeleton";

const CalendarSkeleton = () => {
  return (
	<div className="flex flex-col lg:flex-row items-center lg:items-start space-x-2">
		{/* Calendar Skeleton */}
		<div className="rdp p-3 rounded-md border flex-none mb-2">
		<Skeleton className="h-6 w-32 mb-4" /> {/* Month and year */}
		<div className="grid grid-cols-7 gap-1">
			{[...Array(7)].map((_, i) => (
			<Skeleton key={`day-${i}`} className="h-6 w-6" />
			))}
		</div>
		{[...Array(5)].map((_, weekIndex) => (
			<div key={`week-${weekIndex}`} className="grid grid-cols-7 gap-1 mt-1">
			{[...Array(7)].map((_, dayIndex) => (
				<Skeleton key={`date-${weekIndex}-${dayIndex}`} className="h-9 w-9 rounded-md" />
			))}
			</div>
		))}
		</div>

		{/* Event List Skeleton */}
		<div className="flex-grow">
		<div className="flex flex-col gap-2">
			{/* Date header */}
			<div className="rounded-md border px-6 py-3 flex items-center justify-between">
			<Skeleton className="h-8 w-40" />
			<Skeleton className="h-10 w-24" />
			</div>

			{/* Event cards */}
			{[...Array(5)].map((_, index) => (
			<div key={`event-${index}`} className="rounded-lg border bg-card text-card-foreground shadow-sm w-full pt-6">
				<div className="p-6 pt-0 grid gap-1">
				{[...Array(5)].map((_, lineIndex) => (
					<Skeleton key={`line-${lineIndex}`} className="h-4 w-full" />
				))}
				</div>
				<div className="items-center p-6 pt-0 flex justify-between">
				<Skeleton className="h-10 w-20" />
				<Skeleton className="h-10 w-20" />
				</div>
			</div>
			))}
		</div>
		</div>
	</div>
  );
};

export default CalendarSkeleton;