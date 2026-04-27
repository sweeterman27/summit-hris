'use client';

import React from 'react';
import { SWRConfig } from 'swr';

export const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
});

export default function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig 
      value={{
        fetcher,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 5000, // Dedup identical requests within 5s
      }}
    >
      {children}
    </SWRConfig>
  );
}
