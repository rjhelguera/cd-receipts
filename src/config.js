// Name, tagline and the links shown inside the dashboard. Edit freely.
export const CONFIG = {
  name: 'Creative Direct Receipts',
  tagline: 'Receipts for every YouTube video: clicks, leads, sales.',
  // Where /go/<unknown-code> sends people (can be overridden in Settings).
  fallbackUrl: 'https://www.youtube.com/',
  // Creative Direct — the people who made this tool. The /go codes are tracked on creative-direct.com.
  cd: {
    name: 'Creative Direct',
    site: 'https://www.creative-direct.com/',
    review: 'https://creative-direct.com/go/receipts-review',   // free channel review on Creative Direct Live
    guide: 'https://creative-direct.com/go/receipts-guide',     // free guide: Turn Your Editor Into A Creative Director
    apply: 'https://creative-direct.com/go/receipts-apply',     // work with Creative Direct
    show: 'https://creative-direct.com/go/receipts-show',       // Creative Direct Live on YouTube
    aiPolicy: 'https://creative-direct.com/go/receipts-ai',
  },
  // "Outgrown this?" — the paid tool we recommend for people who want more. Shown last.
  revtrack: {
    name: 'RevTrack',
    url: 'https://getrevtrack.com/?ref=creativedirect', // TODO: replace with the Creative Direct affiliate link
    blurb: 'One-click tracking links on every video, funnel paths, comment analysis, AI video ideas, team seats and real support. Built by Ed Lawrence.',
  },
};
