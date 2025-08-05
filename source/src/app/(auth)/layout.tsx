import '@/styles/globals.css'; 

export const metadata = {
  title: 'Church App - Sign In',
  description: 'Sign in to access your church community',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}