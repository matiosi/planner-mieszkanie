import { redirect } from "next/navigation";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(`/projects/${projectId}/next-actions`);
}
