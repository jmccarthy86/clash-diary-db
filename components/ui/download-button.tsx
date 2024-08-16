import React from "react";
import { Button } from "@/components/ui/button";

interface DownloadButtonProps {
    bookingData: { [key: string]: any };
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ bookingData }) => {
    const handleCSVDownload = () => {
        const csvData = generateCSV(bookingData);
        const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `clash-diary_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generateCSV = (data: { [key: string]: any }): string => {
        const rows = [];
        let headers: string[] = [];

        // Collect headers from the first entry
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const entry = data[key];
                headers = ["Key", ...Object.keys(entry)];
                break; // We only need the headers once
            }
        }

        // Populate rows with data
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const entry = data[key];
                const row = [key, ...headers.slice(1).map((header) => entry[header] || "")];
                rows.push(row.join(","));
            }
        }

        return [headers.join(","), ...rows].join("\n");
    };

    return (
        <Button variant="outline" onClick={handleCSVDownload}>
            Download as CSV
        </Button>
    );
};

export default DownloadButton;
