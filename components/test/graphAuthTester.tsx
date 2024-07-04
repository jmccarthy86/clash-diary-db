// /app/components/GraphClientTester.tsx

"use client";

import React, { useEffect, useState } from 'react';

const GraphClientTester = () => {
  const [driveItems, setDriveItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDriveItems = async () => {
      try {
        const response = await fetch('/api/graphData');
        if (!response.ok) {
          throw new Error('Failed to fetch drive items');
        }
        const data = await response.json();
        setDriveItems(data.value);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDriveItems();
  }, []);

  if (loading) {
    return <div>Loading drive items...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Drive Items</h2>
      <ul>
        {driveItems && driveItems.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default GraphClientTester;
