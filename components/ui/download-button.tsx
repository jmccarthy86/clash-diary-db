import React from "react";
import { Button } from "@/components/ui/button";
import { headers } from "@/lib/config";
import { Popover, PopoverTrigger, PopoverContent } from "@radix-ui/react-popover";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { unCamelCase } from "@/lib/utils";

interface DownloadButtonProps {
    bookingData: { [key: string]: any };
    type: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ bookingData }, type) => {
    //console.log(bookingData);
    const handleCSVDownload = () => {
        const csvData = generateCSV(bookingData);
        const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `first-night-diary_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generateCSV = (data: { [key: string]: any }): string => {
        const rows = [];

        // Filter out "Day" and "UserId" from the imported headers
        const filteredHeaders = headers.filter(
            (header) => header !== "day" && header !== "userId" && header !== "dateBkd"
        );

        rows.push(
            filteredHeaders
                .map((header) => {
                    if (header === "timeStamp") {
                        return "Date Booked"; // Replace TimeStamp with Date Booked
                    }
                    return unCamelCase(header); // Apply unCamelCase to other headers
                })
                .join(",")
        );

        // Populate rows with data, ensuring that missing values are replaced with empty strings
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const entry = data[key];
                // Map the data to the corresponding headers, escaping any commas with quotes
                const row = filteredHeaders.map((header) => {
                    const value = entry[header] || "";
                    // If the value contains a comma, wrap it in double quotes
                    return typeof value === "string" && value.includes(",") ? `"${value}"` : value;
                });
                rows.push(row.join(","));
            }
        }

        return rows.join("\n");
    };

    return (
        <div className="flex gap-2 bg-gray-100 hover:bg-gray-200 pl-2 pe-2 py-2 rounded-md">
            <button className="underline" onClick={handleCSVDownload}>
                Download the below
            </button>
            <Popover>
                <PopoverTrigger className="border border-gray-300 px-1 rounded-sm">
                    <InfoCircledIcon />
                </PopoverTrigger>
                <PopoverContent
                    align="center"
                    sideOffset={16}
                    className="download-button width-[200px] p-4 bg-white rounded-md shadow-lg"
                >
                    {type === "cal"
                        ? "This button will download a spreadsheet of the bookings on the single date shown below. To download a spreadsheet of bookings for more than one date, go to 'List View', select your required date range and click the download button. This way you can view a month, a year or more! Remember the download is a snapshot in time, the most up-to-date information will always be live on this webpage."
                        : "This button will download a spreadsheet of all the bookings on the dates shown below. Use the date selector on this page to view a different range i.e. a month, a year or more! Remember the download is a snapshot in time, the most up-to-date information will always be live on this webpage."}
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default DownloadButton;
