import type { Metadata } from "next";
import { auth } from "@/auth";
import { getUnreadSummary } from "@/lib/data";
import { UnreadProvider } from "@/components/UnreadProvider";
import { Header } from "@/components/Header";
import { AuthSessionProvider } from "@/components/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shared Files",
  description: "Private file sharing, just for us",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  let unreadInitial = { total: 0, byCategory: {} as Record<number, number> };
  if (session?.user?.id) {
    unreadInitial = await getUnreadSummary(Number(session.user.id));
  }

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f7f8fa] antialiased">
        <AuthSessionProvider>
          {session?.user ? (
            <UnreadProvider initial={unreadInitial}>
              <Header userName={session.user.name ?? session.user.email ?? "You"} />
              <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
            </UnreadProvider>
          ) : (
            <main className="min-h-screen">{children}</main>
          )}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
