import { Client } from '@microsoft/microsoft-graph-client';

export const getWorksheetData = async (client: Client, userId: string, itemId: string, worksheetName: string) => {
  try {
    const result = await client
      .api(`/users/${userId}/drive/items/${itemId}/workbook/worksheets('${worksheetName}')/usedRange`)
      .get();
    return result;
  } catch (error) {
    console.error('Error fetching worksheet data:', error);
    throw new Error('Error fetching worksheet data');
  }
};
