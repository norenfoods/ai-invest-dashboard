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
```

建议同时添加到 Production、Preview、Development 三个环境，方便预览部署也能取真实数据。

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

## Mock fallback

项目支持无 key 运行：

- 没有 `FMP_API_KEY` 时，行情、财务、新闻会回退到 mock data
- 没有 `OPENAI_API_KEY` 时，AI 个股分析和 AI 日报会回退到 mock AI 内容
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
   - `/reports`
   - `/alerts`
   - `/stocks/NVDA`

## 投资研究安全边界

该项目只用于研究摘要和风险提示。

所有 AI 输出必须包含：

```text
仅供研究参考，不构成投资建议。
```

项目不提供买入、卖出、持有建议，不提供目标价，不执行任何交易。
