import { Client } from "@microsoft/microsoft-graph-client";
import { initializeGraphClient } from "./.graphClientInitializer";
import { headers } from "@/lib/config";

export type ExcelManagerMethod = keyof {
    [K in keyof ExcelManager]: ExcelManager[K] extends (...args: any[]) => any ? K : never;
}[keyof ExcelManager];

export class ExcelManager {
    private client: Client;
    private workbookId: string;
    private worksheetId: string | null;
    private maxRetries: number;
    private userId: string;

    constructor(workbookId: string, worksheetIdOrName: string, userId: string) {
        this.client = initializeGraphClient();
        this.workbookId = workbookId;
        this.worksheetId = null;
        this.maxRetries = 3;
        this.userId = userId;
        this.initializeWorksheet(worksheetIdOrName);
    }

    public async initializeWorksheet(worksheetIdOrName: string): Promise<void> {
        if (!worksheetIdOrName) {
            throw new Error("Worksheet ID or name must be provided");
        }

        await this.setWorksheet(worksheetIdOrName);

        if (!this.worksheetId) {
            throw new Error(`Unable to set worksheet: ${worksheetIdOrName}`);
        }
    }

    public async setWorksheet(worksheetIdOrName: string): Promise<void> {
        if (this.worksheetId === worksheetIdOrName) {
            return;
        }

        if (
            typeof worksheetIdOrName === "string" &&
            worksheetIdOrName.match(
                /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
            )
        ) {
            // If it looks like a GUID, assume it's an ID
            this.worksheetId = worksheetIdOrName;
        } else {
            // Otherwise, treat it as a name and look up the ID
            const id = await this.findWorksheetIdByName(worksheetIdOrName);
            if (!id) {
                throw new Error(`Worksheet "${worksheetIdOrName}" not found`);
            }
            this.worksheetId = id;
        }
        this.log("SetWorksheet", { worksheetId: this.worksheetId });
    }

    private async findWorksheetIdByName(name: string): Promise<string | null> {
        return this.withRetry(async () => {
            const response = await this.client
                .api(`/users/${this.userId}/drive/items/${this.workbookId}/workbook/worksheets`)
                .get();
            const worksheet = response.value.find((sheet: { name: string }) => sheet.name === name);
            if (worksheet) {
                this.log("FindWorksheetIdByName", { name, foundId: worksheet.id });
                return worksheet.id;
            }
            this.log("FindWorksheetIdByName", { name, result: "Not found" });
            return null;
        });
    }

    public async getWorksheets(): Promise<string[]> {
        return this.withRetry(async () => {
            const response = await this.client
                .api(`/users/${this.userId}/drive/items/${this.workbookId}/workbook/worksheets`)
                .select("name")
                .get();

            const worksheetNames = response.value.map((sheet: { name: string }) => sheet.name);
            this.log("GetWorksheets", { count: worksheetNames.length });
            return worksheetNames;
        });
    }

    public async createWorksheet(name: string): Promise<string> {
        return this.withRetry(async () => {
            // Create the new worksheet
            const response = await this.client
                .api(`/users/${this.userId}/drive/items/${this.workbookId}/workbook/worksheets`)
                .post({
                    name: name,
                });

            this.worksheetId = response.id; // Set the new worksheet as the current one

            // Calculate the range for the headers
            const endColumn = String.fromCharCode("A".charCodeAt(0) + headers.length - 1);
            const headerRange = `A1:${endColumn}1`;

            // Add the headers to the new worksheet
            await this.client
                .api(
                    `/users/${this.userId}/drive/items/${this.workbookId}/workbook/worksheets/${this.worksheetId}/range(address='${headerRange}')`
                )
                .patch({
                    values: [headers],
                });

            this.log("CreateWorksheet", { name, newId: response.id });
            return response.id;
        });
    }

    private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                this.log("Retry", { attempt, error: (error as Error).message });
                if (attempt === this.maxRetries) throw error;
                await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
            }
        }
        throw new Error("Retry failed");
    }

    private log(operation: string, details: Record<string, unknown>): void {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${operation}: ${JSON.stringify(details)}`);
    }

    private async lockRange(range: string): Promise<void> {
        await this.withRetry(async () => {
            await this.client
                .api(
                    `/users/${this.userId}/drive/items/${this.workbookId}/workbook/worksheets/${this.worksheetId}/range(address='${range}')/cell(row=0,column=0)`
                )
                .patch({
                    values: [["LOCKED"]],
                });
            this.log("Lock", { range });
        });
    }

    private async unlockRange(range: string): Promise<void> {
        await this.withRetry(async () => {
            await this.client
                .api(
                    `/users/${this.userId}/drive/items/${this.workbookId}/workbook/worksheets/${this.worksheetId}/range(address='${range}')/cell(row=0,column=0)`
                )
                .patch({
                    values: [[""]],
                });
            this.log("Unlock", { range });
        });
    }

    public async editRow(range: string, newData: any[]): Promise<void> {
        return this.withRetry(async () => {
            try {
                await this.lockRange(range);
                await this.client
                    .api(
                        `/users/${this.userId}/drive/items/${this.workbookId}/workbook/worksheets/${this.worksheetId}/range(address='${range}')`
                    )
                    .patch({
                        values: [newData],
                    });
                this.log("EditRow", { range, newData });
            } finally {
                await this.unlockRange(range);
            }
        });
    }

    public async createNewRow(newData: any[], currentRange: string): Promise<string> {
        return this.withRetry(async () => {
            // Extract the last row from the current range
            const [startCell, endCell] = currentRange.split(":");
            const lastRow = parseInt(endCell.replace(/[A-Z]/g, ""));
            const newRowId = lastRow + 1;

            // Use the same column range as the current range
            const startColumn = startCell.replace(/\d+/, "");
            const endColumn = endCell.replace(/\d+/, "");
            const newRowRange = `${startColumn}${newRowId}:${endColumn}${newRowId}`;

            try {
                await this.lockRange(newRowRange);
                await this.client
                    .api(
                        `/users/${this.userId}/drive/items/${this.workbookId}/workbook/worksheets/${this.worksheetId}/range(address='${newRowRange}')`
                    )
                    .patch({
                        values: [newData],
                    });
                this.log("CreateNewRow", { newRowRange, newData });
                return newRowRange;
            } finally {
                await this.unlockRange(newRowRange);
            }
        });
    }

    public async deleteRow(range: string, yearRange: string): Promise<void> {
        return this.withRetry(async () => {
            try {
                // lock the sheet entirely.
                await this.lockRange(yearRange);
                await this.client
                    .api(
                        `/users/${this.userId}/drive/items/${this.workbookId}/workbook/worksheets/${this.worksheetId}/range(address='${range}')/delete`
                    )
                    .post({ shift: "Up" });
                this.log("DeleteRow", { range });
            } finally {
                await this.unlockRange(yearRange);
            }
        });
    }

    public async readRow(rowId: number): Promise<any[]> {
        return this.withRetry(async () => {
            const response = await this.client
                .api(
                    `/users/${this.userId}/drive/items/${this.workbookId}/workbook/worksheets/${this.worksheetId}/range(address='A${rowId}:Z${rowId}')`
                )
                .get();
            this.log("ReadRow", { rowId });
            return response.values[0];
        });
    }

    public async findRowByValue(columnIndex: number, value: any): Promise<number | null> {
        return this.withRetry(async () => {
            const usedRange = await this.client
                .api(
                    `/users/${this.userId}/drive/items/${this.workbookId}/workbook/worksheets/${this.worksheetId}/usedRange`
                )
                .get();
            const lastRow = parseInt(
                usedRange.address.split("!")[1].split(":")[1].replace(/[A-Z]/g, "")
            );

            for (let i = 1; i <= lastRow; i++) {
                const rowData = await this.readRow(i);
                if (rowData[columnIndex] === value) {
                    this.log("FindRowByValue", { columnIndex, value, foundRow: i });
                    return i;
                }
            }
            this.log("FindRowByValue", { columnIndex, value, result: "Not found" });
            return null; // Not found
        });
    }

    public async getSheet(): Promise<any> {
        return this.withRetry(async () => {
            const response = await this.client
                .api(
                    `/users/${this.userId}/drive/items/${this.workbookId}/workbook/worksheets/${this.worksheetId}`
                )
                .get();
            this.log("GetSheet", { sheetName: response.name });
            return response;
        });
    }

    public async getUsedRangeValues(): Promise<any[][]> {
        return this.withRetry(async () => {
            const response = await this.client
                .api(
                    `/users/${this.userId}/drive/items/${this.workbookId}/workbook/worksheets/${this.worksheetId}/usedRange`
                )
                .get();

            this.log("GetUsedRangeValues", { rowCount: response.values.length });
            return response;
        });
    }

    public async searchGetAllRowsMatching(columnIndex: number, value: any): Promise<any[][]> {
        return this.withRetry(async () => {
            const usedRange = await this.client
                .api(
                    `/users/${this.userId}/drive/items/${this.workbookId}/workbook/worksheets/${this.worksheetId}/usedRange`
                )
                .get();
            const values = usedRange.values as any[][];
            const matchingRows = values.filter((row) => row[columnIndex] === value);
            this.log("SearchGetAllRowsMatching", {
                columnIndex,
                value,
                matchCount: matchingRows.length,
            });
            return matchingRows;
        });
    }
}

// Factory function for asynchronous initialization
export async function createExcelManager(
    workbookId: string,
    worksheetIdOrName: string,
    userId: string
): Promise<ExcelManager> {
    const manager = new ExcelManager(workbookId, worksheetIdOrName, userId);
    await manager.initializeWorksheet(worksheetIdOrName);
    return manager;
}
