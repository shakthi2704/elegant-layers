import type { Metadata } from "next";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Geist, Geist_Mono } from "next/font/google";
import NextTopLoader from 'nextjs-toploader';
import "./globals.css";
import { getShopSettings } from "@/lib/settings";
// import "./globals-copy.css";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  // The browser tab shows the business name from Settings. If the database
  // can't be reached, fall back to the default so the page still loads.
  let name = "Elegant Layers";
  try {
    name = (await getShopSettings()).name;
  } catch {
    // keep the default
  }

  return {
    title: name,
    description: "Cake shop management and POS system",
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextTopLoader
          color="var(--color-primary)"
          initialPosition={0.08}
          crawlSpeed={100}
          height={1}
          crawl
          showSpinner={false}
          easing="ease"
          speed={100}
        />

        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}

        </ThemeProvider>
      </body>
    </html>
  );
}
