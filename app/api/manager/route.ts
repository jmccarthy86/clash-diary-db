// app/api/excel/bridge/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createExcelManager, ExcelManager } from '@/lib/ExcelManager';

const isExcelManagerMethod = (excelManager: ExcelManager, method: string): method is keyof ExcelManager => {
	return typeof (excelManager as any)[method] === 'function';
};

export async function POST(request: NextRequest) {
	const { method, year, args } = await request.json();
	const workbookId = process.env.WORKBOOK_ID!;
	const userId = process.env.USER_ID!;

	console.log(`Received request: method=${method}, year=${year}, args=`, args);

	try {
		console.log('Creating ExcelManager...');
		const excelManager = await createExcelManager(workbookId, year.toString(), userId);
		console.log('ExcelManager created successfully');

		if (!isExcelManagerMethod(excelManager, method)) {
			throw new Error(`Method ${method} does not exist on ExcelManager`);
		}

		console.log(`Calling method: ${method}`);
		// Use a type assertion here
		const result = await (excelManager[method] as Function).apply(excelManager, args);

		return NextResponse.json({ result }, { status: 200 });
	} catch (error) {
		console.error('Error in Excel bridge:', error);
		return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
}