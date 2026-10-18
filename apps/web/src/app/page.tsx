import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { FeedContainer } from "@/components/FeedContainer";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return <FeedContainer />;
}
