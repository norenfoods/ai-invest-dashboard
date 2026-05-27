import { notFound } from "next/navigation";
import AiMarketMapView from "@/components/AiMarketMapView";
import { getAiMarketMap } from "@/lib/ai-industry/maps";

export const dynamic = "force-dynamic";

export default async function GlobalAiMarketMapPage() {
  const map = await getAiMarketMap("global-ai");

  if (!map) {
    notFound();
  }

  return <AiMarketMapView map={map} eyebrow="Global AI Industry Chain" />;
}
