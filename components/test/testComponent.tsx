// /app/components/ExcelDataHandler.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { fetchExcelData, saveExcelData, convertExcelDataToObject, convertObjectToExcelData } from '@/lib/excelUtils';

const ExcelDataHandler = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = process.env.NEXT_PUBLIC_USER; //'2fc1c1e9-1d43-4871-80d5-c1d7e0123b70';
  const documentId = process.env.NEXT_PUBLIC_DOCUMENT; //'013KFWGDYV4STW6K7EXZG27OMSPG3C5V6D';
  const sheetName = 'TEST';
  const range = 'A1:H100';

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const excelData = await fetchExcelData(userId, documentId, sheetName, range);
        const objects = convertExcelDataToObject(excelData);
        setData(objects);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId, documentId, sheetName, range]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const excelData = convertObjectToExcelData(data);
      await saveExcelData(userId, documentId, sheetName, excelData);
      alert('Data saved successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, key: string, value: any) => {
    const updatedData = [...data];
    updatedData[index][key] = value;
    setData(updatedData);
  };

  console.log(data);

  return (
    <div>
      <h2>Excel Data Handler</h2>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      <table>
        <thead>
          <tr>
            {data.length > 0 && Object.keys(data[0]).filter(key => key !== '_range').map((key, index) => (
              <th key={index}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {Object.keys(row).filter(key => key !== '_range').map((key, colIndex) => (
                <td key={colIndex}>
                  <input
                    type="text"
                    value={row[key]}
                    onChange={e => handleChange(rowIndex, key, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleSave} disabled={loading}>Save Data</button>
    </div>
  );
};

export default ExcelDataHandler;
