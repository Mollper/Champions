import type { Metadata, Viewport } from "next";
import { Onest, Unbounded } from "next/font/google";
import { MotionProvider } from "@/components/motion/motion-provider";
import "./globals.css";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "UniRoute — персональный маршрут поступления",
    template: "%s · UniRoute",
  },
  description:
    "Короткая анкета → диагностика профиля → подходящие университеты с шансами на поступление → пошаговый план: экзамены, документы, дедлайны.",
};

export const viewport: Viewport = {
  themeColor: "#f6f6fb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${onest.variable} ${unbounded.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
