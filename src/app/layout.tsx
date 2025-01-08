import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Prisma Schema Generator",
  description: "Generate Prisma schemas with ease",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <header className="bg-primary text-primary-foreground py-4">
            <div className="container px-4">
              <h1 className="text-2xl font-bold">Prisma Schema Generator</h1>
            </div>
          </header>
          <main className="flex-grow container my-8">{children}</main>
          <footer className="bg-secondary py-4">
            <div className="container text-center text-secondary-foreground space-x-8">
              <span>© 2025 Prisma Schema Generator</span>
              <a href="https://github.com/N4thanJ" target="_blank">
                Created By{" "}
                <span className="text-blue-800 font-bold">N4thanJ</span>
              </a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
