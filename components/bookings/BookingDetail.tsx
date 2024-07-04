import React from 'react';
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import EditBooking from '@/components/bookings/EditBooking'; 
import { unCamelCase } from '@/lib/utils';
import { useExcel } from '@/context/ExcelContext';
import { toast } from "@/components/ui/use-toast";

const BadgeVariants = {
  P: { bg: 'bg-red-500', text: 'text-white' },
  OPERA_DANCE: { bg: 'bg-blue-500', text: 'text-white' },
  GALA_NIGHT: { bg: 'bg-green-500', text: 'text-white' },
};

function CustomBadge({ type, children }: { type: keyof typeof BadgeVariants; children: React.ReactNode }) {
  return (
    <Badge
      variant="outline"
      className={`mr-2 ${BadgeVariants[type].bg} ${BadgeVariants[type].text} px-3 py-2 rounded-md`}
    >
      {children}
    </Badge>
  );
}

interface BookingDetailProps {
  rowRange: string;
  rowData: any;
  currentSelectedDate: Date;
  allowEdit: boolean;
}

export default function BookingDetail({ rowRange, rowData, currentSelectedDate, allowEdit }: BookingDetailProps) {
  const { submitData, refreshData } = useExcel();

  const { UserId, P, GALA_NIGHT, OPERA_DANCE, ...otherDetails } = rowData;
  const hiddenValues = ['IsSeasonGala', 'IsOperaDance', 'DateBkd', 'ShowIsTitleTba', 'VenueIsTba', 'range', 'Venue', 'OtherVenue'];

  const handleDelete = async () => {
    try {
      await submitData('delete', rowRange, rowData);
      await refreshData(); // Refresh data after successful deletion
      toast({
        title: "Booking deleted successfully",
        description: "The booking has been removed from the calendar.",
      });
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast({
        title: "Error deleting booking",
        description: "There was an error deleting the booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog>
      <Card className="w-full mb-4 pt-6" data-relation={UserId || undefined}>
        <CardContent className="grid gap-1">
          {Object.entries(otherDetails).map(([key, value]) => (
            value && !hiddenValues.includes(key) && (
              <div key={key}>
                <strong>{unCamelCase(key)}:</strong> {value}
              </div>
            )
          ))}

          {(otherDetails.Venue === 'N/A' || otherDetails.Venue === '') ? (
            otherDetails.OtherVenue && otherDetails.OtherVenue !== 'N/A' && (
              <div key="OtherVenue">
                <strong>Other Venue:</strong> {otherDetails.OtherVenue}
              </div>
            )
          ) : (
            <div key="Venue">
              <strong>Venue:</strong> {otherDetails.Venue}
            </div>
          )}

          <div className="flex">
            {P && P !== 'N/A' && <CustomBadge type="P">{P}</CustomBadge>}
            {otherDetails.IsSeasonGala && otherDetails.IsSeasonGala !== 'N/A' && <CustomBadge type="OPERA_DANCE">Opera/Dance</CustomBadge>}
            {otherDetails.IsOperaDance && otherDetails.IsOperaDance !== 'N/A' && <CustomBadge type="GALA_NIGHT">Season Announcement/Gala Night</CustomBadge>}
          </div>
        </CardContent>
        {allowEdit && (
          <>
            <DialogTrigger asChild>
              <Button variant="outline">Edit</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Booking</DialogTitle>
                <DialogDescription>
                  Make changes to your booking here. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <EditBooking
                rowRange={rowRange}
                currentDetail={rowData}
                currentSelectedDate={currentSelectedDate}
              />
            </DialogContent>
            <CardFooter className="flex justify-between">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete this booking?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the booking from our records.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </>
        )}
      </Card>
    </Dialog>
  );
}