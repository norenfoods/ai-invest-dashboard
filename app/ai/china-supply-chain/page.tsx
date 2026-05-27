import {
  getChinaSupplyChain,
  type ChinaExchange,
  type ChinaPolicyNarrative,
  type ChinaSupplyChainCompanyWithQuote,
  type ChinaSupplyChainLayerDetail,
} from "@/lib/ai-industry/chinaSupplyChain";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

const narrativeTerm: Record<ChinaPolicyNarrative, { cn: string; className: string }> = {
  "China Domestic Substitution": {
    cn: "国产替代",
    className: "border-terminal-cyan/45 text-terminal-cyan",
  },
  "Sovereign AI": {
    cn: "主权AI",
    className: "border-terminal-green/45 text-terminal-green",
  },
  "Export Control Pressure": {
    cn: "出口管制压力",
    className: "border-terminal-red/45 text-terminal-red",
  },
  "AI Compute Localization": {
    cn: "AI算力国产化",
    className: "border-terminal-amber/50 text-terminal-amber",
  },
  "Semiconductor Self-Sufficiency": {
    cn: "半导体自主可控",
    className: "border-sky-300/45 text-sky-300",
  },
  "Optical / PCB AI Capex": {
    cn: "光模块 / PCB算力资本开支",
    className: "border-fuchsia-300/45 text-fuchsia-300",
  },
};

const exchangeClass: Record<ChinaExchange, string> = {
  "A-share": "border-terminal-cyan/45 text-terminal-cyan",
  STAR: "border-terminal-green/45 text-terminal-green",
  HK: "border-terminal-amber/50 text-terminal-amber",
  ADR: "border-sky-300/45 text-sky-300",
  Ecosystem: "border-terminal-border text-terminal-muted",
};

const dataStatusClass = {
  live: "bg-terminal-green/15 text-terminal-green",
  fallback: "bg-terminal-amber/15 text-terminal-amber",
  missing: "bg-terminal-border/70 text-terminal-muted",
};

const formatPrice = (value?: number | null): string =>
  typeof value === "number" && Number.isFinite(value) && value > 0
    ? value.toFixed(2)
    : "n/a";

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

const layerCoverage = (layer: ChinaSupplyChainLayerDetail): number => {
  if (!layer.companies.length) {
    return 0;
  }

  const covered = layer.companies.filter(
    (company) => company.quote.dataStatus !== "missing",
  ).length;
  return covered / layer.companies.length;
};

const layerPolicyIntensity = (layer: ChinaSupplyChainLayerDetail): number =>
  layer.companies.reduce((sum, company) => sum + company.narratives.length, 0) /
  Math.max(layer.companies.length, 1);

export default async function ChinaSupplyChainPage() {
  const layers = await getChinaSupplyChain();
  const companies = layers.flatMap((layer) => layer.companies);
  const narratives = Array.from(
    new Set(companies.flatMap((company) => company.narratives)),
  );
  const strongestSubstitutionLayer = layers
    .slice()
    .sort((a, b) => layerPolicyIntensity(b) - layerPolicyIntensity(a))[0];
  const weakestDomesticGap =
    layers.find((layer) => layer.id === "memory-storage") ??
    layers
      .slice()
      .sort((a, b) => layerCoverage(a) - layerCoverage(b))[0];
  const exchangeCounts = companies.reduce(
    (acc, company) => {
      acc[company.exchange] = (acc[company.exchange] ?? 0) + 1;
      return acc;
    },
    {} as Record<ChinaExchange, number>,
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-terminal-border bg-terminal-panel/92 shadow-panel">
        <div className="border-b border-terminal-border p-6">
          <p className="text-sm text-terminal-cyan">
            China AI Domestic Substitution
            <span className="ml-2 text-terminal-muted">中国AI国产替代 / 自主可控</span>
          </p>
          <div className="mt-3 grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <h1 className="text-3xl font-semibold text-terminal-text">
                China AI Supply Chain Intelligence Dashboard
              </h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-terminal-muted">
                China-only institutional map focused on domestic substitution,
                sovereign AI, export-control pressure, AI infrastructure
                localization, and supply-chain bottlenecks.
              </p>
            </div>
            <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
              {Object.entries(exchangeCounts).map(([exchange, count]) => (
                <span
                  key={exchange}
                  className={`rounded border px-2.5 py-1 text-xs ${exchangeClass[exchange as ChinaExchange]}`}
                >
                  {exchange} · {count}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-4 md:grid-cols-5">
          <SummaryTile
            label="Companies Tracked"
            secondaryLabel="覆盖公司"
            value={String(companies.length)}
            detail={`${layers.length} China-only lanes`}
          />
          <SummaryTile
            label="Most Critical Bottleneck"
            secondaryLabel="核心瓶颈"
            value="Foundry / Equipment"
            detail="Export-control sensitive manufacturing base"
          />
          <SummaryTile
            label="Strongest Substitution Layer"
            secondaryLabel="最强替代环节"
            value={strongestSubstitutionLayer?.name ?? "n/a"}
            detail={strongestSubstitutionLayer?.secondary ?? ""}
          />
          <SummaryTile
            label="Weakest Domestic Gap"
            secondaryLabel="最弱国产短板"
            value={weakestDomesticGap?.name ?? "n/a"}
            detail={weakestDomesticGap?.secondary ?? ""}
          />
          <SummaryTile
            label="Policy Narratives"
            secondaryLabel="政策叙事"
            value={String(narratives.length)}
            detail={narratives.slice(0, 2).join(" · ")}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="rounded-lg border border-terminal-border bg-terminal-panel/92 shadow-panel">
          <div className="flex flex-col gap-3 border-b border-terminal-border p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-terminal-text">
                Upstream to Downstream Localization Flow
              </h2>
              <p className="mt-1 text-sm text-terminal-muted">
                Lanes connect domestic chips, fabs, equipment, packaging,
                servers, interconnect, cloud platforms, and AI applications.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {narratives.map((narrative) => (
                <NarrativeBadge key={narrative} narrative={narrative} />
              ))}
            </div>
          </div>

          <div className="overflow-x-auto p-4">
            <div className="flex min-w-[2760px] gap-3">
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
                      {layer.name}
                      <span className="ml-1.5 text-xs font-normal text-terminal-muted">
                        {layer.secondary}
                      </span>
                    </h3>
                    <p className="mt-2 min-h-[72px] text-xs leading-5 text-terminal-muted">
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
          <Panel title="Bottlenecks">
            <PanelItem
              label="Advanced Foundry"
              secondaryLabel="先进晶圆代工"
              value="SMIC and Hua Hong are strategic base-layer nodes, but advanced process availability remains the highest-sensitivity bottleneck."
            />
            <PanelItem
              label="Equipment Localization"
              secondaryLabel="设备国产化"
              value="NAURA, AMEC, Piotech, Hwatsing, Kingsemi, and ACM Shanghai define the pace of fab self-sufficiency."
            />
            <PanelItem
              label="HBM / Memory Gap"
              secondaryLabel="高带宽存储短板"
              value="Montage, GigaDevice, Ingenic, and Biwin provide memory/storage exposure, but domestic HBM remains a structural gap."
            />
          </Panel>

          <Panel title="Policy Sensitivity">
            <PanelItem
              label="Export Control Pressure"
              secondaryLabel="出口管制压力"
              value="Chips, foundry, equipment, EDA/IP, and memory carry the highest policy beta."
            />
            <PanelItem
              label="Sovereign AI"
              secondaryLabel="主权AI"
              value="Cloud/model platforms and state-linked compute demand reinforce the localization cycle."
            />
            <PanelItem
              label="No Fake Huawei Ticker"
              secondaryLabel="华为不设虚假代码"
              value="Huawei Ascend is represented only as ecosystem context with no direct listed ticker and no quote-enabled company node."
            />
          </Panel>

          <Panel title="Second-Order Beneficiaries">
            <PanelItem
              label="Optical / PCB AI Capex"
              secondaryLabel="光模块 / PCB算力资本开支"
              value="Innolight, Eoptolink, TFC, Accelink, WUS, Victory Giant, Shennan, and Shengyi benefit from AI cluster density."
            />
            <PanelItem
              label="Power & Cooling"
              secondaryLabel="电力与散热"
              value="Envicool, Kehua, Shenling, and Goaland sit behind localized datacenter buildouts."
            />
            <PanelItem
              label="Enterprise AI Software"
              secondaryLabel="企业AI软件"
              value="iFlytek, Kingsoft Office, Yonyou, Kingdee, SenseTime, and Meitu test application monetization."
            />
          </Panel>

          <Panel title="Current China AI Cycle Read">
            <div className="space-y-3 text-sm leading-6 text-terminal-muted">
              <p>
                The China AI cycle is localization-led rather than pure growth-led:
                export controls and sovereign compute priorities raise the value
                of domestic bottleneck nodes.
              </p>
              <p>
                The clearest listed beta sits in semiconductor equipment,
                advanced packaging, AI servers, high-speed optics, PCB, and
                datacenter cooling.
              </p>
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
  secondaryLabel: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-md border border-terminal-border bg-terminal-panelSoft/70 p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-terminal-muted">
        {label}
        <span className="ml-1.5 normal-case tracking-normal">{secondaryLabel}</span>
      </div>
      <div className="mt-2 line-clamp-2 min-h-[48px] text-lg font-semibold leading-6 text-terminal-text">
        {value}
      </div>
      <div className="mt-2 text-xs text-terminal-muted">{detail}</div>
    </div>
  );
}

function NarrativeBadge({ narrative }: { narrative: ChinaPolicyNarrative }) {
  const term = narrativeTerm[narrative];

  return (
    <span className={`rounded border px-2 py-1 text-[11px] ${term.className}`}>
      {narrative}
      <span className="ml-1.5 text-terminal-muted">{term.cn}</span>
    </span>
  );
}

function CompanyNode({ company }: { company: ChinaSupplyChainCompanyWithQuote }) {
  const hasDirectListedTicker = Boolean(company.quoteSymbol);

  return (
    <div
      className={`rounded border p-2.5 transition hover:border-terminal-cyan/50 ${
        hasDirectListedTicker
          ? "border-terminal-border bg-terminal-bg/60"
          : "border-dashed border-terminal-border/80 bg-terminal-panelSoft/45"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-terminal-text">
            {company.chineseName}
            <span className="ml-1.5 text-xs font-normal text-terminal-muted">
              {company.englishName}
            </span>
          </div>
          {hasDirectListedTicker ? (
            <div className="mt-0.5 text-xs text-terminal-muted">
              {company.ticker}
            </div>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] ${exchangeClass[company.exchange]}`}
        >
          {company.exchange}
        </span>
      </div>

      {!hasDirectListedTicker ? (
        <div className="mt-2 rounded border border-terminal-border/80 bg-terminal-bg/35 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-terminal-muted">
          Ecosystem / no direct listed ticker
        </div>
      ) : null}

      {hasDirectListedTicker ? (
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
      ) : null}

      <div className="mt-2 text-xs leading-5 text-terminal-muted">
        {company.role}
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {hasDirectListedTicker ? (
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] ${
              dataStatusClass[company.quote.dataStatus ?? "missing"]
            }`}
          >
            {company.quote.dataStatus ?? "missing"}
          </span>
        ) : null}
        {company.narratives.slice(0, 2).map((narrative) => (
          <span
            key={narrative}
            className={`rounded border px-1.5 py-0.5 text-[10px] ${narrativeTerm[narrative].className}`}
          >
            {narrative}
          </span>
        ))}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
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
  secondaryLabel: string;
  value: string;
}) {
  return (
    <div className="rounded border border-terminal-border bg-terminal-panelSoft/70 p-3">
      <div className="text-sm font-medium text-terminal-text">
        {label}
        <span className="ml-1.5 text-xs font-normal text-terminal-muted">
          {secondaryLabel}
        </span>
      </div>
      <div className="mt-1 text-xs leading-5 text-terminal-muted">{value}</div>
    </div>
  );
}
