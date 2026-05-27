import {
  getGlobalSupplyChain,
  type SupplyChainCompanyWithQuote,
  type SupplyChainLayerDetail,
  type SupplyChainNarrative,
  type SupplyChainRegion,
} from "@/lib/ai-industry/globalSupplyChain";
import {
  abbreviationTerms,
  getCompanyDisplayName,
  getLayerTerm,
  getNarrativeTerm,
} from "@/lib/ai-industry/terminology";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

const narrativeClass: Record<SupplyChainNarrative, string> = {
  "AI capex": "border-terminal-cyan/45 text-terminal-cyan",
  HBM: "border-terminal-amber/50 text-terminal-amber",
  inference: "border-terminal-green/45 text-terminal-green",
  "datacenter power": "border-terminal-red/45 text-terminal-red",
  "optical networking": "border-sky-300/45 text-sky-300",
  robotics: "border-fuchsia-300/45 text-fuchsia-300",
  "cloud AI": "border-indigo-300/45 text-indigo-300",
  "sovereign AI": "border-terminal-cyan/45 text-terminal-cyan",
  "advanced packaging": "border-terminal-amber/50 text-terminal-amber",
  "AI agent infrastructure": "border-terminal-green/45 text-terminal-green",
  cybersecurity: "border-terminal-red/45 text-terminal-red",
};

const regionClass: Record<SupplyChainRegion, string> = {
  US: "border-terminal-cyan/50 text-terminal-cyan",
  Taiwan: "border-terminal-green/50 text-terminal-green",
  Korea: "border-terminal-amber/50 text-terminal-amber",
  Japan: "border-fuchsia-300/50 text-fuchsia-300",
  Europe: "border-sky-300/50 text-sky-300",
  China: "border-terminal-red/50 text-terminal-red",
};

const dataStatusClass = {
  live: "bg-terminal-green/15 text-terminal-green",
  fallback: "bg-terminal-amber/15 text-terminal-amber",
  missing: "bg-terminal-border/70 text-terminal-muted",
};

const formatPrice = (value?: number | null): string =>
  typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "n/a";

const formatChange = (value?: number | null): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "n/a";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
};

const changeTone = (value?: number | null): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "text-terminal-muted";
  }

  return value >= 0 ? "text-terminal-green" : "text-terminal-red";
};

const BilingualLabel = ({
  primary,
  secondary,
  primaryClassName = "",
  secondaryClassName = "",
}: {
  primary: string;
  secondary?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
}) => (
  <>
    <span className={primaryClassName}>{primary}</span>
    {secondary ? (
      <span className={`ml-1.5 text-terminal-muted ${secondaryClassName}`}>
        {secondary}
      </span>
    ) : null}
  </>
);

const layerCoverage = (layer: SupplyChainLayerDetail): number => {
  if (!layer.companies.length) {
    return 0;
  }

  const covered = layer.companies.filter(
    (company) => company.quote.dataStatus !== "missing",
  ).length;
  return covered / layer.companies.length;
};

const layerMomentum = (layer: SupplyChainLayerDetail): number =>
  layer.companies.reduce(
    (sum, company) => sum + (company.quote.changesPercentage ?? 0),
    0,
  ) / Math.max(layer.companies.length, 1);

export default async function GlobalSupplyChainPage() {
  const layers = await getGlobalSupplyChain();
  const companies = layers.flatMap((layer) => layer.companies);
  const narratives = Array.from(
    new Set(companies.flatMap((company) => company.narratives)),
  );
  const strongestLayer = layers
    .slice()
    .sort((a, b) => layerMomentum(b) - layerMomentum(a))[0];
  const weakestCoverage = layers
    .slice()
    .sort((a, b) => layerCoverage(a) - layerCoverage(b))[0];
  const regionCounts = companies.reduce(
    (acc, company) => {
      acc[company.region] = (acc[company.region] ?? 0) + 1;
      return acc;
    },
    {} as Record<SupplyChainRegion, number>,
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-terminal-border bg-terminal-panel/92 shadow-panel">
        <div className="border-b border-terminal-border p-6">
          <p className="text-sm text-terminal-cyan">
            Global AI Supply Chain
            <span className="ml-2 text-terminal-muted">全球AI供应链</span>
          </p>
          <div className="mt-3 grid gap-5 lg:grid-cols-[1fr_340px] lg:items-end">
            <div>
              <h1 className="text-3xl font-semibold text-terminal-text">
                Listed Company Industrial Chain Dashboard
              </h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-terminal-muted">
                Bloomberg-style institutional map of AI infrastructure and
                software exposure across the US, Japan, Korea, Taiwan, Europe,
                and selected China-listed bottleneck nodes. Chinese labels are
                used as a secondary recognition layer.
              </p>
            </div>
            <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
              {Object.entries(regionCounts).map(([region, count]) => (
                <span
                  key={region}
                  className={`rounded border px-2.5 py-1 text-xs ${regionClass[region as SupplyChainRegion]}`}
                >
                  {region} · {count}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-4 md:grid-cols-4">
          <SummaryTile
            label="Companies Tracked"
            secondaryLabel="覆盖公司"
            value={String(companies.length)}
            detail={`${layers.length} supply-chain lanes`}
          />
          <SummaryTile
            label="Strongest Layer"
            secondaryLabel="最强环节"
            value={
              strongestLayer
                ? getLayerTerm(strongestLayer.id).primary
                : "n/a"
            }
            detail={`${
              strongestLayer ? layerMomentum(strongestLayer).toFixed(2) : "0.00"
            }% avg move`}
          />
          <SummaryTile
            label="Weakest Data Coverage"
            secondaryLabel="最低数据覆盖"
            value={
              weakestCoverage
                ? getLayerTerm(weakestCoverage.id).primary
                : "n/a"
            }
            detail={`${Math.round(
              weakestCoverage ? layerCoverage(weakestCoverage) * 100 : 0,
            )}% quoted`}
          />
          <SummaryTile
            label="Active Narratives"
            secondaryLabel="活跃叙事"
            value={String(narratives.length)}
            detail={narratives
              .slice(0, 3)
              .map((narrative) => getNarrativeTerm(narrative).primary)
              .join(" · ")}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="rounded-lg border border-terminal-border bg-terminal-panel/92 shadow-panel">
          <div className="flex flex-col gap-3 border-b border-terminal-border p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-terminal-text">
                Upstream to Downstream Flow
              </h2>
              <p className="mt-1 text-sm text-terminal-muted">
                Scroll horizontally from semiconductor equipment and foundry to
                cloud, software, applications, and automation.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {narratives.map((narrative) => (
                <span
                  key={narrative}
                  className={`rounded border px-2 py-1 text-[11px] ${narrativeClass[narrative]}`}
                >
                  <BilingualLabel {...getNarrativeTerm(narrative)} />
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto p-4">
            <div className="flex min-w-[2600px] gap-3">
              {layers.map((layer, index) => (
                <div
                  key={layer.id}
                  className="relative flex w-[230px] shrink-0 flex-col rounded-md border border-terminal-border bg-terminal-panelSoft/50"
                >
                  {index < layers.length - 1 ? (
                    <div className="absolute -right-3 top-12 z-10 h-px w-3 bg-terminal-cyan/50" />
                  ) : null}
                  <div className="border-b border-terminal-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded border border-terminal-cyan/40 text-xs font-semibold text-terminal-cyan">
                        {layer.order}
                      </div>
                      <div className="text-right text-[11px] text-terminal-muted">
                        {Math.round(layerCoverage(layer) * 100)}% data
                      </div>
                    </div>
                    <h3 className="mt-3 min-h-[44px] text-sm font-semibold leading-5 text-terminal-text">
                      <BilingualLabel {...getLayerTerm(layer.id)} />
                    </h3>
                    <p className="mt-2 min-h-[54px] text-xs leading-5 text-terminal-muted">
                      {layer.thesis}
                    </p>
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-2">
                    {layer.companies.map((company) => (
                      <CompanyNode key={company.id} company={company} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <Panel title="Key Bottlenecks">
            <PanelItem
              label="HBM Supply"
              secondaryLabel="高带宽存储供给"
              value="SK Hynix SK海力士, Samsung Electronics 三星电子, Micron, Kioxia, and Western Digital define the memory and storage supply read-through."
            />
            <PanelItem
              label="Advanced Foundry"
              secondaryLabel="先进晶圆代工"
              value="TSMC 台积电 and EUV (极紫外光刻) tool capacity remain the central manufacturing control point."
            />
            <PanelItem
              label="Advanced Packaging Constraint"
              secondaryLabel="先进封装约束"
              value="ASE Technology 日月光, Amkor, JCET, Tongfu, BESI, and Hanmi sit behind CoWoS (晶圆级先进封装), TSV (硅通孔), and AI package complexity."
            />
            <PanelItem
              label="Power & Thermal"
              secondaryLabel="电力与散热"
              value="Vertiv, Eaton, Schneider Electric 施耐德电气, Trane, Johnson Controls, colocation landlords, and server ODMs define the physical deployment constraint."
            />
          </Panel>

          <Panel title="Second-Order Beneficiaries">
            <PanelItem
              label="Networking & Optics"
              secondaryLabel="网络与高速光互联"
              value="Arista, Marvell, Astera, Credo, Coherent, Fabrinet, Ciena, Applied Optoelectronics, and Nokia/Infinera benefit as clusters scale toward optical networking and CPO (共封装光学)."
            />
            <PanelItem
              label="Packaging & Test"
              secondaryLabel="先进封装与测试"
              value="Amkor, ASE, JCET, Tongfu, BESI, Hanmi, Advantest 爱德万测试, and Disco increase the packaging/test density of the map."
            />
            <PanelItem
              label="AI Agent Infrastructure"
              secondaryLabel="AI智能体基础设施"
              value="MongoDB, Elastic, Confluent, Datadog, CrowdStrike, Palo Alto Networks, Zscaler, Palantir, ServiceNow, Snowflake, SAP, and Adobe improve software-layer narrative density."
            />
            <PanelItem
              label="Robotics Renaissance"
              secondaryLabel="机器人复兴"
              value="FANUC, Yaskawa, Keyence, ABB, Rockwell, and Siemens provide listed exposure to factory automation and embodied AI optionality."
            />
          </Panel>

          <Panel title="Current AI Cycle Read">
            <div className="space-y-3 text-sm leading-6 text-terminal-muted">
              <p>
                The cycle still reads infrastructure-led: compute, HBM, foundry,
                packaging, networking, and datacenter power remain the clearest
                constraint chain.
              </p>
              <p>
                Downstream software and applications matter most when inference
                usage proves durable enough to absorb the capex already being
                deployed.
              </p>
            </div>
          </Panel>

          <Panel title="Critical Abbreviations">
            <div className="flex flex-wrap gap-2">
              {abbreviationTerms.map((term) => (
                <span
                  key={term.primary}
                  className="rounded border border-terminal-border bg-terminal-panelSoft/70 px-2 py-1 text-xs text-terminal-text"
                >
                  <BilingualLabel {...term} />
                </span>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  secondaryLabel,
  value,
  detail,
}: {
  label: string;
  secondaryLabel?: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-md border border-terminal-border bg-terminal-panelSoft/70 p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-terminal-muted">
        {label}
        {secondaryLabel ? (
          <span className="ml-1.5 normal-case tracking-normal">{secondaryLabel}</span>
        ) : null}
      </div>
      <div className="mt-2 line-clamp-2 min-h-[48px] text-lg font-semibold leading-6 text-terminal-text">
        {value}
      </div>
      <div className="mt-2 text-xs text-terminal-muted">{detail}</div>
    </div>
  );
}

function CompanyNode({ company }: { company: SupplyChainCompanyWithQuote }) {
  const displayName = getCompanyDisplayName(company.name);

  return (
    <div className="rounded border border-terminal-border bg-terminal-bg/60 p-2.5 transition hover:border-terminal-cyan/50">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-terminal-text">
            {displayName.primary}
            {displayName.secondary ? (
              <span className="ml-1.5 text-xs font-normal text-terminal-muted">
                {displayName.secondary}
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 text-xs text-terminal-muted">
            {company.ticker}
          </div>
        </div>
        <span
          className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] ${regionClass[company.region]}`}
        >
          {company.region}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-terminal-muted">Price</div>
          <div className="mt-0.5 text-terminal-text">
            {formatPrice(company.quote.price)}
          </div>
        </div>
        <div>
          <div className="text-terminal-muted">Change</div>
          <div
            className={`mt-0.5 font-medium ${changeTone(
              company.quote.changesPercentage,
            )}`}
          >
            {formatChange(company.quote.changesPercentage)}
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs leading-5 text-terminal-muted">
        {company.role}
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] ${
            dataStatusClass[company.quote.dataStatus ?? "missing"]
          }`}
        >
          {company.quote.dataStatus ?? "missing"}
        </span>
        {company.narratives.slice(0, 2).map((narrative) => (
          <span
            key={narrative}
            className={`rounded border px-1.5 py-0.5 text-[10px] ${narrativeClass[narrative]}`}
          >
            {getNarrativeTerm(narrative).primary}
          </span>
        ))}
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-terminal-border bg-terminal-panel/92 p-4 shadow-panel">
      <h2 className="text-lg font-semibold text-terminal-text">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function PanelItem({
  label,
  secondaryLabel,
  value,
}: {
  label: string;
  secondaryLabel?: string;
  value: string;
}) {
  return (
    <div className="rounded border border-terminal-border bg-terminal-panelSoft/70 p-3">
      <div className="text-sm font-medium text-terminal-text">
        {label}
        {secondaryLabel ? (
          <span className="ml-1.5 text-xs font-normal text-terminal-muted">
            {secondaryLabel}
          </span>
        ) : null}
      </div>
      <div className="mt-1 text-xs leading-5 text-terminal-muted">{value}</div>
    </div>
  );
}
