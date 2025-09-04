import * as XLSX from "xlsx";
import { buildWorkbook } from "@/lib/export/xlsx";
import { unCamelCase } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@radix-ui/react-popover";
import { InfoCircledIcon } from "@radix-ui/react-icons";

interface DownloadButtonProps {
    bookingData: { [key: string]: any };
    type?: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ bookingData, type }) => {
    const handleExcelDownload = () => {
        const { buffer, filename } = generateXlsx(bookingData);
        const blob = new Blob([buffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generateXlsx = (data: { [key: string]: any }) => {
        const filename = "first-night-diary.xlsx";
        const wb = buildWorkbook(data || {});
        const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        return { buffer, filename };
    };

    return (
        <div className="flex gap-2 bg-gray-100 hover:bg-gray-200 pl-2 pe-2 py-2 rounded-md">
            <button className="underline" onClick={handleExcelDownload}>
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
                        ? "This button downloads an Excel file (.xlsx) of the bookings on the single date shown below. For more than one date, go to 'List View', select your required date range and click the download button."
                        : "This button downloads an Excel file (.xlsx) of all the bookings on the dates shown below. Use the date selector to change the range (e.g. month, year)."}
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default DownloadButton;
