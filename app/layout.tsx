import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "srikanth/ui — the components shadcn/ui doesn't ship",
  description:
    "Time picker, phone input, password input, number input and more — install with the shadcn CLI, own the code.",
  metadataBase: new URL("https://srikanth-ui.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full`}
    >
      {/* A column flex container stretches its children to the widest one's
          min-content, and `min-width: 0` does not undo that — a demo that means
          to scroll (a board) would drag the whole page past the viewport with it.
          `w-full` makes the width definite instead of content-driven. */}
      <body className="min-h-full flex flex-col antialiased [&>*]:w-full">{children}</body>
    </html>
  );
}
