import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CustomerAccessPage } from "@/components/views/customer-access-page";

export const dynamic = "force-dynamic";

async function getUser(token: string) {
  return db.user.findFirst({
    where: { shareToken: token, role: "CUSTOMER" },
    select: { displayName: true, username: true },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const user = await getUser(token);

  if (!user) {
    return {
      title: "Promos – Promo Access",
      description: "View your promo campaign status, sounds and TikTok videos.",
      openGraph: {
        title: "Promos – Promo Access",
        description: "View your promo campaign status, sounds and TikTok videos.",
        type: "website",
      },
    };
  }

  const name = user.displayName || user.username;
  const title = `Promos – ${name}`;
  const description = `View your promo campaign status, sounds and TikTok videos.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function CustomerAccessRoute({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <CustomerAccessPage token={token} />;
}
