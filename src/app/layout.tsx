import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { AppProvider } from "../context/AppContext";
import { AuthProvider } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import MobileNavigation from "../components/MobileNavigation";
import Footer from "../components/Footer";
import CivicSaathiAI from "../components/CivicSaathiAI";

export const metadata: Metadata = {
  title: "Nagrik Setu | Benefits Found. Voices Heard. Problems Solved.",
  description: "AI-powered civic platform for welfare-scheme discovery, transparent grievance reporting and citizen-verified resolution.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Nagrik Setu",
    statusBarStyle: "default",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body suppressHydrationWarning className="h-full min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-50 civic-ambient-bg">
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              try {
                const theme = window.localStorage.getItem('nagriksetu_themeMode') || 'bright';
                const html = document.documentElement;
                const body = document.body;
                html.classList.remove('bright', 'dark');
                body.classList.remove('bright', 'dark');
                html.classList.add(theme);
                body.classList.add(theme);
                if (theme === 'dark') {
                  html.classList.add('dark');
                  body.classList.add('dark');
                }
              } catch (e) {
                console.warn('Theme initialization failed', e);
              }
            })();`,
          }}
        />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-stone-900">
          Skip to main content
        </a>
        <AuthProvider>
          <AppProvider>
            <Navbar />
            <main id="main-content" className="flex-1 min-h-0 flex flex-col pb-20 lg:pb-0">
              {children}
            </main>
            <Footer />
            <MobileNavigation />
            <CivicSaathiAI />
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
