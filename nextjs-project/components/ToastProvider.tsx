'use client';

import { Toaster } from 'sonner';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      theme="dark"
      closeButton
      toastOptions={{
        style: {
          background: '#0f172a',
          border: '1px solid #1e293b',
          color: '#f8fafc',
        },
      }}
    />
  );
}
