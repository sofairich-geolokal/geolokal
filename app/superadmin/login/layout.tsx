import React from 'react';

export default function SuperadminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full overflow-hidden">
      {children}
    </div>
  );
}

// This layout overrides the parent layout to prevent authentication check
export const runtime = 'nodejs';
