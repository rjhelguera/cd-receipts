# Creative Direct Receipts — see which YouTube videos bring you leads and sales

Receipts for every video. A free, open-source tracker for business owners who use YouTube to get customers. One tracked link per video, a one-line snippet on your website, and a dashboard that shows **which videos produce clicks, leads, sales and revenue** — not just views.

Made by [Creative Direct](https://www.creative-direct.com/). Runs in **your own free Cloudflare account**, so your data stays yours and there is nothing to pay.

> **Want more?** This is the starting point. When you want one-click tracking links across your whole channel, funnel-path views, comment analysis, AI video ideas, team seats and real support, use [RevTrack](https://getrevtrack.com/) by Ed Lawrence. We recommend it and we're not trying to replace it.

---

## Easiest setup: let your AI do it

Works with **Claude, ChatGPT, Gemini, Grok, Meta AI, Copilot** or any assistant that can read text. No paid plan is needed; the free tier of any of them is enough to be walked through it.

**If your AI can open links** (Claude, ChatGPT, Gemini, Grok, Copilot usually can), paste this:

> Set up Creative Direct Receipts for me, following its guide exactly: https://github.com/rjhelguera/cd-receipts/blob/main/AI-SETUP.md — ask me the questions in the guide first, then give me one step at a time.

**If your AI can't open links** (Meta AI in WhatsApp/Instagram, some app versions), open [`PROMPT.md`](PROMPT.md), copy everything in it, and paste it as your first message. It contains the whole guide.

Your AI will ask about your offers, your website platform and how you take payments, then walk you through the 10-minute setup for your exact situation. Some assistants (Claude Code, ChatGPT agent mode, Cursor) can also run the commands for you; the others guide you click by click. Both work.

## Or do it yourself (about 10 minutes)

1. **Create a free Cloudflare account** at https://dash.cloudflare.com/sign-up (no card needed) and a free GitHub account at https://github.com/signup if you don't have one (Cloudflare saves your copy of the code there).
2. **Deploy**: click the button below and follow the prompts. It creates the Worker and the database in your account.

   [![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/rjhelguera/cd-receipts)

   You'll get an address like `https://cd-receipts.yourname.workers.dev`. Open it, click **Finish setup**, and create your dashboard password.
3. **(Recommended) Put it on your own domain**, e.g. `go.yoursite.com`. In Cloudflare: Workers & Pages → your Worker → Settings → Domains & Routes → Add → Custom domain. Short links then look like `go.yoursite.com/go/v12-guide`. (Your site's DNS has to be on Cloudflare for this; if it isn't, the workers.dev address works fine.)
4. **In the dashboard**: add an **offer** (where you send people: a free guide, a booking page, a product page), then create a **tracked link** for a video and paste that link into the video's description and pinned comment.
5. **Add the snippet** to your website, right before `</body>` on every page (or at least your landing pages and thank-you pages):

   ```html
   <script src="https://go.yoursite.com/t.js"></script>
   ```

   On the page people see **after they pay**, add the amount:

   ```html
   <script src="https://go.yoursite.com/t.js" data-sale="497"></script>
   ```
6. **Sales**: connect Stripe in Settings (webhook, 2 minutes), use the `data-sale` snippet above, send sales from Zapier/Make, or just type them into the dashboard. All four work together.

## How it attributes a sale to a video

1. Each video gets its own link: `go.yoursite.com/go/v12-guide`. When someone clicks it, the tracker gives them an anonymous visitor id, remembers it in a cookie, and sends them to your page with `?ytc=<id>` on the end.
2. The snippet on your page stores that id on *your* domain and reports the page view. It also adds the id to any Stripe Payment Link or Calendly link on the page, and fills in any hidden `<input name="ytc">` in your forms.
3. When they sign up (snippet sees a form with an email field, or your tool sends a lead to `/api/lead`), the tracker stores the lead with the video that first brought them.
4. When they buy (Stripe webhook, `data-sale`, Zapier, or manual), the sale is credited to a video by **visitor id first**, then by **email** (if that email came in as a lead earlier). This is what makes it work when someone watches on their phone and buys on a laptop a week later: as long as you captured their email somewhere along the way, it matches.
5. A sale with neither shows as **not attributed** so you always know how much you can't see.

Expect roughly 80% of sales to attribute cleanly; that is normal for every tool in this category, including paid ones.

## Works with

- **Any website** you can add a script tag to: WordPress, Webflow, Squarespace, Wix, Framer, Carrd (Pro), Kajabi, ClickFunnels, GoHighLevel, Shopify, custom sites.
- **Stripe** (Payment Links, Checkout, subscriptions) via webhook.
- **Calendly** links (the visitor id and link code are passed through as UTM parameters, so a booking can be matched when you record it).
- **Zapier / Make / n8n / your own code**: `POST /api/lead` and `POST /api/sale` with the API key from Settings. Examples are on the Settings page.
- **Email tools** (Kit, Mailchimp, ActiveCampaign…): add a hidden `ytc` field to your form, or send new subscribers to `/api/lead` through Zapier.
- **YouTube view counts**: optional free YouTube Data API key (Settings) fills in views and titles; otherwise type views in from YouTube Studio.

## Next steps inside the dashboard

The bottom of the dashboard points to a free live channel review on Creative Direct Live, the free guide *Turn Your Editor Into A Creative Director*, and how to work with Creative Direct — and, last, to RevTrack for people who've outgrown the free tool.

## What's deliberately NOT here

One-click rewriting of every description on your channel, funnel-path visualisations, comment analysis, AI video ideas, team seats, multiple channels, email support. [RevTrack](https://getrevtrack.com/) does all of that, and if this tool shows you that YouTube makes you money, that's the upgrade.

## Costs and limits

- Cloudflare's free plan covers 100,000 requests a day and 5 GB of database. For a business channel that is effectively unlimited.
- Free tool, provided as-is under the MIT licence. There is no support line. Issues and pull requests are welcome on GitHub.
- You are responsible for your own privacy notice. The tracker stores: click time, link code, country, referring page, browser string, an anonymous visitor id, and the emails/names you send it. No IP addresses are stored.

## Files

- `src/worker.js` — redirects, APIs, Stripe webhook, dashboard data
- `src/admin.js` — the dashboard, settings, login pages
- `src/snippet.js` — the `/t.js` script for your pages
- `src/config.js` — name, tagline and the links shown in the dashboard (edit before you deploy your own fork)
- `src/brand.js` — the Creative Direct mark
- `PROMPT.md` — the AI setup guide as a paste-in prompt for assistants that can't open links
- `migrations/0001_init.sql` — database tables (also created automatically on first request)

## Developing

```
npm i -g wrangler
wrangler dev --local        # http://localhost:8787
wrangler deploy             # after setting database_id in wrangler.toml (wrangler d1 create cd-receipts)
```
