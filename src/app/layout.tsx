import type { Metadata, Viewport } from "next";
import { Onest, Unbounded } from "next/font/google";
import { cookies } from "next/headers";
import { MotionProvider } from "@/components/motion/motion-provider";
import { I18nProvider } from "@/i18n/client";
import { getLocale, getT } from "@/i18n/server";
import { parseTheme, THEME_COOKIE, themeAttributes } from "@/lib/theme";
import "./globals.css";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: {
      default: t("UniRoute — персональный маршрут поступления"),
      template: "%s · UniRoute",
    },
    description: t("Короткая анкета → диагностика профиля → подходящие университеты с шансами на поступление → пошаговый план: экзамены, документы, дедлайны."),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#14121f" },
  ],
};

// Glass refraction uses an SVG filter inside backdrop-filter, which only Chromium renders;
// elsewhere the attribute stays off and the glass keeps a plain blur.
const REFRACTION_CHECK = `try{var b=navigator.userAgentData&&navigator.userAgentData.brands||[];if(b.some(function(x){return /Chromium/.test(x.brand)}))document.documentElement.dataset.refraction="on"}catch(e){}`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [jar, locale] = await Promise.all([cookies(), getLocale()]);
  const theme = parseTheme(jar.get(THEME_COOKIE)?.value);

  return (
    <html
      lang={locale}
      {...themeAttributes(theme)}
      className={`${onest.variable} ${unbounded.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: REFRACTION_CHECK }} />
      </head>
      <body className="flex min-h-full flex-col">
        <svg aria-hidden width="0" height="0" className="absolute">
          <filter id="liquid-refraction" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" seed="7" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2" result="soft" />
            <feDisplacementMap in="SourceGraphic" in2="soft" scale="26" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        <I18nProvider locale={locale}>
          <MotionProvider>{children}</MotionProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
