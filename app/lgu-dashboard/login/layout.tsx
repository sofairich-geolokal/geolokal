export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout intentionally bypasses the parent dashboard layout
  // to provide a full-screen login experience without sidebar or header
  return (
    <div className="min-h-screen w-full">
      {children}
    </div>
  );
}
