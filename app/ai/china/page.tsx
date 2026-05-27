import { notFound } from "next/navigation";
import AiMarketMapView from "@/components/AiMarketMapView";
import { getAiMarketMap } from "@/lib/ai-industry/maps";

export const dynamic = "force-dynamic";

export default async function ChinaAiMarketMapPage() {
  const map = await getAiMarketMap("china-domestic-substitution");

  if (!map) {
    notFound();
  }

  return <AiMarketMapView map={map} eyebrow="China AI 国产替代 Chain" />;
}
