# Happy Diwali 2026 — A Special Wish From Mehul Sharma

A responsive, interactive Diwali greeting experience built with HTML, CSS, and vanilla JavaScript. Fireworks are drawn on the Canvas API, and a gentle diya chime is synthesized locally with the Web Audio API when sound is enabled.

## Run locally

No build step or package installation is required. From this folder, start any static file server, for example:

```bash
npx serve .
```

Or use the VS Code **Live Server** extension and open `index.html` with **Open with Live Server**. Opening the HTML file directly also renders the site, although browser sharing and clipboard permissions work best on `localhost` or HTTPS.

## Deploy to Vercel

1. Put `index.html`, `style.css`, `script.js`, `README.md`, `robots.txt`, and the `assets/` folder in the project root.
2. Push the project to a GitHub repository, or install the Vercel CLI and run `vercel` from this folder.
3. In the Vercel import flow, choose the repository and select **Other** as the framework preset. Leave the build command empty and set the output directory to `.`.
4. Deploy. Vercel will display a public `https://...vercel.app` address when the deployment finishes. Share that address, or enter a name on the page and use **Copy my wish link** to copy the same clean public link with the greeting section anchor. Names are never added to shared links.

The anaar fountain is started with its on-page button and can be replayed as often as you like.

The site uses Google Fonts, Font Awesome, and GSAP from their public CDNs. Its illustrations and fireworks are generated in-browser.

## Accessibility and responsive behavior

The page uses semantic sections, keyboard-accessible controls, visible focus states, live announcements for interaction feedback, a skip link, and reduced-motion support. Visitors can enter a name to open a personalized, animated family greeting with continuing fireworks behind it; the name is rendered as text and is not sent to a server. Both diyas start unlit and glow only after the visitor chooses to light them. The layout is mobile-first and includes compact layouts for narrow screens. Canvas resolution and particle counts are limited on smaller screens; animations pause while the tab is hidden or the wish section is off-screen.
