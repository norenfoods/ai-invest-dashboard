# 中文美股 AI 投资研究仪表盘

一个面向美股研究的中文仪表盘 MVP。项目用于投资研究、风险跟踪和日报整理，不做自动交易，不生成买入、卖出、持有建议。

## 功能模块

- Dashboard 首页：指数概览、自选股排行、持仓摘要、AI 市场摘要、风险预警
- Watchlist 自选股：本地管理自选股，支持添加、删除、重置
- Stock Detail 个股详情：价格、估值、利润率、新闻、AI 个股研究摘要、规则预警
- AI Daily Report：中文日报，包括市场概览、自选股异动、主要风险、明日关注事项
- Alerts 预警中心：基于规则引擎生成风险提示
- Portfolio 持仓管理：本地持仓、组合市值、浮动盈亏、仓位占比、持仓风险

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- Recharts
- Financial Modeling Prep API
- OpenAI Responses API
- localStorage 本地自选股和持仓存储
- 内存缓存 simpleCache

## 本地启动

```bash
npm install
npm run dev
```

默认访问：

```text
http://localhost:3000
```

生产构建检查：

```bash
npm run build
npm run start
```

## .env.local 配置

复制示例文件：

```bash
cp .env.local.example .env.local
```

填写：

```env
FMP_API_KEY=你的_FMP_API_KEY
OPENAI_API_KEY=你的_OPENAI_API_KEY
```

两个 key 都是可选的。缺少 key 时项目不会报致命错误，会自动使用 mock fallback。

## 数据源说明

- FMP 用于行情、公司资料、财务报表、新闻、指数代理数据
- OpenAI 用于中文研究摘要和 AI 日报
- mock data 用于无 key、API 失败、网络失败或数据缺失时的 fallback
- 自选股和持仓暂时存储在浏览器 localStorage，不接数据库

## AI 安全边界

本项目只生成研究摘要、风险提示和后续观察点。

固定原则：

- 不做自动交易
- 不输出买入、卖出、持有建议
- 不输出目标价
- 不生成交易信号
- 所有 AI 输出必须包含：仅供研究参考，不构成投资建议。

## 部署到 Vercel

1. 将项目推送到 GitHub。
2. 在 Vercel 新建项目并导入该仓库。
3. Framework Preset 选择 Next.js。
4. 在 Vercel Project Settings → Environment Variables 添加：
   - `FMP_API_KEY`
   - `OPENAI_API_KEY`
5. 点击 Deploy。

部署后如果没有配置 API key，页面仍会使用 mock fallback 正常运行。
