import { PinterestClient } from "./pinterest-client";

export default async function PinterestPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <PinterestClient projectId={projectId} />;
}
