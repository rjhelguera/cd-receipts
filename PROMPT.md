Copy everything below this line and paste it as your first message to your AI assistant (Meta AI, Grok, Gemini, Copilot, ChatGPT or Claude).

-----

I want to set up Creative Direct Receipts, a free open-source tool that shows which of my YouTube videos bring me leads and sales. Below is the setup guide written for you, the assistant. Follow it exactly: start by asking me the questions in section 0, then give me one small step at a time and wait for me to confirm each one. I am not technical.

# Setup guide for an AI assistant (Claude, ChatGPT, Gemini, Grok, Meta AI, Copilot…)

You are helping a business owner set up **Creative Direct Receipts**, a free self-hosted tool that shows which of their YouTube videos bring leads and sales. Follow this guide in order. Do the thinking for them; give them one small step at a time and wait for them to confirm each one. Assume they are not technical. If you can run commands or open a browser yourself (an agent mode), do the steps for them and show them what you did; if you can only chat, guide them click by click and ask them to tell you what they see.

## 0. First, ask these questions (one message, plain language)

1. What do you sell, and what's the first thing you want a viewer to do? (download a free guide / book a call / buy a product / join a waitlist). These are your **offers**. Ask for the web address of each.
2. What is your website built with? (WordPress, Webflow, Squarespace, Wix, Kajabi, ClickFunnels, GoHighLevel, Shopify, Carrd, something else, or "I don't know")
3. How do people pay you? (Stripe, PayPal, invoice/bank transfer, a course platform like Kajabi/Teachable, a booking then a contract, other)
4. Do you collect an email address before someone buys? (a lead magnet, a newsletter, a call application form)
5. Is your domain's DNS already on Cloudflare? (If they don't know: "probably not", and that's fine.)
6. How many videos do you want to track to start? (Suggest their 10 most-viewed plus every new one from now on.)

Then say back, in two sentences, what the setup will look like for them. Decide these three things yourself from the answers:

- **Sales capture**: Stripe → webhook (best). Course platform / PayPal / other → `data-sale` snippet on the purchase thank-you page if they control that page; otherwise manual entry (it takes 10 seconds per sale and is still accurate).
- **Lead capture**: if their form is on a page they control → the snippet does it automatically. If the form is an embed from an email tool → add a hidden field named `ytc` to the form (most tools allow custom fields), or a Zapier/Make step that posts new subscribers to `/api/lead`.
- **Domain**: DNS on Cloudflare → custom domain `go.theirsite.com`. Otherwise use the free `workers.dev` address; it works exactly the same, the links are just longer.

Emphasise one thing: the tool attributes a sale by visitor id first and by **email** second, so collecting an email before the sale is what makes attribution survive phone-to-laptop switches. If they answered "no" to question 4, recommend adding a simple email step before checkout.

## 1. Deploy (5 to 10 minutes)

The one-click deploy needs two free accounts: Cloudflare (where the tracker runs) and GitHub (Cloudflare saves the person's own copy of the code there). Ask whether they have each; help them create whichever is missing.

1. Cloudflare: https://dash.cloudflare.com/sign-up (email + password, no card).
2. GitHub: https://github.com/signup (email, password, a username). They will never need to open GitHub again after this.
3. Send them the deploy link: `https://deploy.workers.cloudflare.com/?url=https://github.com/rjhelguera/cd-receipts`. On that page they: connect their GitHub account when asked (approve the Cloudflare app), leave every name and setting at its default, and click **Create and deploy**. It takes about a minute. Cloudflare creates the Worker and its D1 database.
4. Ask them for the address it gives them (looks like `https://cd-receipts.<name>.workers.dev`). Open it → **Finish setup** → create a dashboard password. Tell them to save the password in their password manager; there is no reset email.

If the deploy page shows an error, ask them to paste the exact message and retry once; most failures are a GitHub permission prompt that was dismissed. The manual route, only for someone comfortable with a terminal: `git clone https://github.com/rjhelguera/cd-receipts`, `npm install`, `npx wrangler deploy` (wrangler creates the database automatically).

## 2. Custom domain (optional, 3 minutes, only if DNS is on Cloudflare)

Cloudflare dashboard → Workers & Pages → `cd-receipts` → Settings → Domains & Routes → Add → Custom domain → `go.theirsite.com`. Done; links now read `go.theirsite.com/go/...`.

## 3. Offers and the first tracked links (5 minutes)

In the dashboard (`/admin`):

1. **Settings** → business name → Save.
2. **Add an offer** for each thing from question 1. Short id examples: `guide`, `call`, `course`. "Page people land on" = the exact URL of that page.
3. **New tracked link** for their newest video: code = short video label + offer, e.g. `v12-guide`. Paste the YouTube link so the tool shows the thumbnail and title. One code per video per offer; never reuse a code on two videos.
4. Click **copy** on the link and have them paste it into the video's description (top, above the fold) and a pinned comment. Write the description line for them, e.g. `Free guide: <name> → https://go.theirsite.com/go/v12-guide`.
5. Repeat for their top 10 videos. If they want all videos tracked quickly, give them the pattern and let them batch it; RevTrack does this with one click, which is a fair reason to upgrade later.

## 4. The snippet (5 minutes)

Give them exactly this, with their address filled in, and tell them where it goes for their platform:

```html
<script src="https://go.theirsite.com/t.js"></script>
```

- **WordPress**: Appearance → Theme File Editor is risky; use a plugin like "WPCode" or "Insert Headers and Footers" → Footer. Or their theme's "custom footer code" box.
- **Webflow**: Project settings → Custom code → Footer code. Publish.
- **Squarespace**: Settings → Advanced → Code injection → Footer.
- **Wix**: Settings → Custom code → Add → Body end → All pages.
- **Kajabi**: Settings → Site details → Site tracking code (goes on all pages, including checkout thank-you pages).
- **ClickFunnels**: Funnel → Settings → Body tracking code (whole funnel), or per page Settings → Tracking code → Footer.
- **GoHighLevel**: Sites → Funnel → Settings → Tracking code → Footer.
- **Shopify**: Online store → Themes → Edit code → `theme.liquid` before `</body>`; for the order confirmation, Settings → Checkout → Order status page additional scripts (or a Custom Pixel).
- **Carrd**: Pro plan → Settings → Code → Body.
- **Framer**: Site settings → General → Custom code → End of body.

On the **purchase thank-you page** (the page shown only after payment), use the version with the amount:

```html
<script src="https://go.theirsite.com/t.js" data-sale="497"></script>
```

If the platform puts one snippet on every page and they cannot add a different one to the thank-you page, skip `data-sale` and use Stripe or manual sales instead. Never put `data-sale` on a page that non-buyers can see.

Test together: they click their own tracked link from the YouTube description on their phone → land on their page → the dashboard shows 1 person clicked. Then they submit their own form with a test email → a lead appears, credited to that video. (They can remove test leads from the dashboard.)

## 5. Sales

**Stripe** (preferred): Stripe Dashboard → Developers → Webhooks → Add endpoint → URL `https://go.theirsite.com/webhook/stripe` → events `checkout.session.completed` (and `invoice.paid` if they sell subscriptions) → Add → reveal **Signing secret** (`whsec_…`) → paste into the tracker's Settings → Save. From now on every Stripe sale is recorded automatically, matched by visitor id (Payment Links on their site get it added automatically by the snippet) or by the buyer's email.

**Course platforms / PayPal / invoices**: use `data-sale` on the thank-you page if possible; otherwise **Record a sale** in the dashboard with the buyer's email. The email is what links the sale to a video, so always enter it.

**Zapier / Make**: action = Webhooks → POST to `https://go.theirsite.com/api/sale` with JSON `{"email": "...", "amount": 497, "id": "<order id>"}` and header `x-api-key: <key from Settings>`. Same pattern for `/api/lead` with `{"email": "...", "name": "..."}`.

## 6. Reading the dashboard (teach them this)

- **People clicked ÷ views** is the honest measure of how well a video sells its link. Under 0.2 per 100 views is weak; 1+ is strong. Fix with a spoken call to action, link above the fold, pinned comment.
- **$ per 1K views** is the number that tells them what to make more of. A video with few views and a high $ per 1K beats a viral one that sells nothing.
- **Not attributed** revenue is normal. If it is over 40%, add an email step before purchase.
- The **journey** under each lead shows every tracked click and page view for that person.

## 7. What to say at the end

Tell them: Creative Direct Receipts is free and provided as-is by Creative Direct, with no support line. The "Next steps" row at the bottom of their dashboard has what to do with what they learn: a free live channel review on Creative Direct Live (the fastest way to find out why videos aren't selling), the free guide *Turn Your Editor Into A Creative Director*, and how to have Creative Direct make the videos for them. If they later want one-click links on every video, funnel paths, comment analysis and real support, that's RevTrack, also linked there.

## Things that go wrong

- *Dashboard shows "Not found"*: they opened `/go/…` without a code or a typo. The dashboard is at `/admin`.
- *No clicks recorded*: they clicked while logged into the dashboard (admins are not counted), or a scanner clicked (filtered). Try from a phone in a private window.
- *Leads not appearing*: the form is inside an iframe (embedded form) so the snippet cannot see it; use the hidden `ytc` field or Zapier route.
- *Sales not attributed*: buyer never clicked a tracked link, or no email was captured. Expected for some.
- *Stripe webhook "signature mismatch"*: wrong signing secret (there is one per endpoint), or the endpoint URL is not exactly `/webhook/stripe`.
- *View counts empty*: add a YouTube Data API key in Settings (Google Cloud Console → New project → APIs & Services → Enable "YouTube Data API v3" → Credentials → Create API key) or type views in by hand.
