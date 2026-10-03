import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { PermissionProvider } from "@/context/PermissionProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Ekhone Admin Portal",
  description: "Ekhone Ecommerce Management & Admin Dashboard",
  icons: {
    icon: [
      { url: "/ekhone.png", type: "image/png" },
      { url: "/favicon.ico" }
    ],
    shortcut: "/ekhone.png",
    apple: "/ekhone.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${manrope.variable} antialiased font-sans`}
      >
        <PermissionProvider>
          {children}
          <Toaster
            toastOptions={{
              style: {
                background: "#102D50",
                color: "#FFFFFF",
                borderRadius: "10px",
              },
            }}
          />
        </PermissionProvider>
      </body>
    </html>
  );
}
