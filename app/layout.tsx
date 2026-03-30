import type { Metadata } from "next";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "./globals.css";
import { ResponsiveWrapper } from "@/components/ResponsiveWrapper";

export const metadata: Metadata = {
  title: "ERP",
  description: "Minimal ERP System",
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "Poppins, sans-serif", margin: 0, padding: 0, overflowX: "hidden", width: "100%", maxWidth: "100vw" }}>
        <MantineProvider>
          <ResponsiveWrapper>
            {children}
          </ResponsiveWrapper>
        </MantineProvider>
      </body>
    </html>
  );
}
