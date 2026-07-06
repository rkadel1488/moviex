This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## SlideMorph AI (`/ppt`)

An AI presentation studio built into this app. Type a topic and Claude
(Anthropic API) designs a complete deck — theme, layouts, copy, and speaker
notes — as structured JSON. The browser renders it with PowerPoint-Morph-style
shared-element transitions (framer-motion `layoutId`), plus fade/slide/zoom.

- **Generate**: `POST /api/ppt/generate` calls Claude (`claude-opus-4-8`) with
  structured outputs; requires `ANTHROPIC_API_KEY` in `.env.local`.
- **Present**: fullscreen presenter with keyboard navigation (arrows/space,
  `N` for speaker notes, `Esc` to exit) and live morph transitions.
- **Edit**: double-click any text on a slide to edit it.
- **Export**: downloads a real `.pptx` (pptxgenjs) with slides, theme colors,
  and speaker notes. Note: the `.pptx` format can't embed the live morph
  animation — apply PowerPoint's built-in Morph transition after import if
  you want it there too; presenting in the browser has it natively.
- **Demo**: a built-in sample deck lets you try the studio without an API key.
