import { Skeleton } from "@/components/ui/skeleton";

const TableSkeleton = () => {
  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-2">
        <div className="grid gap-2 w-full lg:w-auto">
          <Skeleton className="h-10 w-full lg:w-[300px]" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-10 flex-1 lg:w-[120px]" />
          <Skeleton className="h-10 flex-1 lg:w-[120px]" />
        </div>
      </div>
      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                {['Date', '', ''].map((_, index) => (
                  <th key={index} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                    {index === 0 && <Skeleton className="h-4 w-20" />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {[...Array(10)].map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer">
                  <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                    <div className="flex items-center">
                      <Skeleton className="h-4 w-4 mr-2" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </td>
                  <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                    <Skeleton className="h-10 w-10 ml-auto" />
                  </td>
                  <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right">
                    <Skeleton className="h-10 w-24 ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="w-full flex items-center justify-between py-4 px-2">
        <Skeleton className="h-4 w-40" />
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-[70px]" />
          </div>
          <Skeleton className="h-8 w-[100px]" />
          <div className="flex items-center space-x-2">
            {[...Array(4)].map((_, index) => (
              <Skeleton key={index} className="h-8 w-8" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableSkeleton;