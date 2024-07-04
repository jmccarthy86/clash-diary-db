"use client";

import React, { useEffect, useState } from 'react';
import { useGraphClient } from '../../context/GraphAuthContext';
import { getWorksheetData } from './.graph';

interface GraphDataComponentProps {
  userId: string;
  itemId: string;
  worksheetName: string;
}

const GraphDataComponent: React.FC<GraphDataComponentProps> = ({ userId, itemId, worksheetName }) => {
  const graphClient = useGraphClient();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getWorksheetData(graphClient, userId, itemId, worksheetName);
        setData(result);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    fetchData();
  }, [graphClient, userId, itemId, worksheetName]);

  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div>
      {/* Render data as needed */}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default GraphDataComponent;
