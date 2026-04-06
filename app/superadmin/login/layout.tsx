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
