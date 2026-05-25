# 部署说明

## Vercel 环境变量

在 Vercel 项目中进入：

```text
Project Settings → Environment Variables
```

添加：

```env
FMP_API_KEY=你的 Financial Modeling Prep API key
OPENAI_API_KEY=你的 OpenAI API key
OPENAI_MODEL=可选 OpenAI model
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase Project URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=你的 Supabase publishable key
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase service role key
CRON_SECRET=自定义强随机字符串
```

建议同时添加到 Production、Preview、Development 三个环境，方便预览部署也能取真实数据。
`SUPABASE_SERVICE_ROLE_KEY` 和 `CRON_SECRET` 只能放在服务端环境变量里，不要写进前端代码，也不要提交到 GitHub。

## 本地和线上区别

本地：

- 使用 `.env.local`
- 自选股和持仓保存在当前浏览器的 localStorage
- 开发时可用 `npm run dev`

线上：

- 使用 Vercel Environment Variables
- 不会读取你的本地 `.env.local`
- 自选股和持仓仍保存在访问者浏览器 localStorage
- 服务端 API key 只在 Vercel Server Runtime 中使用，不会暴露到前端
- Vercel Cron 每天 UTC 00:00 触发，也就是北京时间 08:00，调用 `/api/cron/generate-morning-brief`
- Cron API 会校验 `CRON_SECRET`，没有密钥或密钥错误会返回 401

## Mock fallback

项目支持无 key 运行：

- 没有 `FMP_API_KEY` 时，行情、财务、新闻会回退到 mock data
- 没有 `OPENAI_API_KEY` 时，AI 个股分析和 AI 日报会回退到 mock AI 内容
- 没有 `SUPABASE_SERVICE_ROLE_KEY` 时，Morning Brief 页面仍可生成内容，但历史归档不会写入数据库
- API 请求失败时也会 fallback

这保证项目可以先部署、先展示，再逐步补齐真实数据能力。

## API key 安全

不要把真实 key 提交到 GitHub。

已在 `.gitignore` 中忽略：

```text
.env
.env.local
.env*.local
```

只提交 `.env.local.example` 作为配置模板。

## 部署步骤

1. 本地确认构建通过：

```bash
npm run build
```

2. 推送代码到 GitHub。
3. 在 Vercel 导入仓库。
4. 添加环境变量。
5. 部署。
6. 部署完成后检查：
   - `/`
   - `/watchlist`
   - `/portfolio`
   - `/morning-brief`
   - `/morning-brief/archive`
   - `/reports`
   - `/alerts`
   - `/stocks/NVDA`

## Morning Brief Cron

项目根目录包含：

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-morning-brief",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Vercel Cron 使用 UTC 时间，`0 0 * * *` 对应北京时间每天 08:00。定时任务会先检查 Supabase 中当天是否已经有 `morning_briefs.date` 记录；如果已有，则跳过生成，避免重复日报。

## Supabase Morning Brief 表

在 Supabase SQL Editor 执行 `supabase/migrations/20260525080000_create_morning_briefs.sql` 中的 SQL。表字段包括：

- `id`
- `date`
- `title`
- `content_markdown`
- `summary`
- `created_at`

## Supabase Research Memory 表

在 Supabase SQL Editor 执行 `supabase/migrations/20260525090000_create_research_memory.sql` 中的 SQL。表字段包括：

- `id`
- `date`
- `category`
- `symbol`
- `title`
- `content`
- `tags`
- `created_at`

Morning Brief 保存后会自动沉淀每日市场观察、风险变化、板块状态和重点股票状态。后续 Morning Brief 会读取最近 3 天、7 天、30 天研究记忆作为历史上下文。

## 投资研究安全边界

该项目只用于研究摘要和风险提示。

所有 AI 输出必须包含：

```text
仅供研究参考，不构成投资建议。
```

项目不提供买入、卖出、持有建议，不提供目标价，不执行任何交易。
