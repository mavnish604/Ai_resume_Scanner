import "./globals.css";

export const metadata = {
  title: "ATS Resume Scanner — AI-Powered Resume Analysis",
  description: "Upload your resume and get instant AI-powered scoring on content relevance, visual layout, and semantic match against any job description.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
