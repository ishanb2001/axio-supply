import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../public/thumbnails");
const base = process.env.DEMO_BASE || "http://localhost:5174";

/** @type {{ id: string; file: string; waitMs?: number; scrollY?: number | "max"; click?: string; prepare?: (page: import("playwright").Page) => Promise<void> }[]} */
const demos = [
  { id: "liquid-glass-sidebar", file: "liquid-glass-sidebar.html", waitMs: 1400 },
  { id: "glass-circles", file: "glass-circles.html", waitMs: 1400 },
  { id: "wind-row", file: "wind-row.html", waitMs: 600 },
  { id: "card-frame", file: "card-frame.html", waitMs: 700 },
  { id: "pill-slide", file: "pill-slide/index.html", waitMs: 800 },
  { id: "service-hover", file: "service-hover.html", waitMs: 1600 },
  { id: "glass-layer-cards", file: "glass-layer-cards/index.html", waitMs: 1800 },
  { id: "glass-tile-strip", file: "glass-tile-strip.html", waitMs: 1600 },
  { id: "glass-type-hero", file: "glass-type-hero.html", waitMs: 1800 },
  {
    id: "scroll-cube",
    file: "scroll-cube.html",
    waitMs: 250,
    prepare: async (page) => {
      const pose = () => {
        const scrollEl = document.getElementById("cube-scroll");
        const stage = document.getElementById("cube-stage");
        const cube = document.getElementById("cube");
        const rig = document.getElementById("cube-rig");
        if (!scrollEl || !stage || !cube || !rig) return;
        const total = scrollEl.offsetHeight - window.innerHeight;
        const progress = 0.08 + 0.66 * 0.5;
        const top =
          scrollEl.getBoundingClientRect().top + window.scrollY + progress * total;
        window.scrollTo(0, top);
        const height = stage.offsetHeight || window.innerHeight;
        const depth = height / 2;
        const theta = Math.PI / 4;
        const z = -depth * (Math.sin(theta) + Math.cos(theta));
        cube.classList.add("is-scaled");
        rig.style.transform = `translateZ(${z}px) rotateX(45deg)`;
        window.scrollTo = () => {};
      };
      await page.evaluate(() => {
        window.requestAnimationFrame = () => 0;
      });
      await page.waitForTimeout(40);
      await page.evaluate(pose);
      await page.waitForTimeout(80);
      await page.evaluate(pose);
    },
  },
  { id: "image-side", file: "image-side.html", scrollY: 900, waitMs: 900 },
  { id: "color-lines", file: "color-lines.html", scrollY: 600, waitMs: 800 },
  { id: "banner-text", file: "banner-text.html", waitMs: 2200 },
  { id: "card-animation", file: "card-animation.html", scrollY: 500, waitMs: 1000 },
  {
    id: "section-objects-arrive",
    file: "section-objects-arrive.html",
    scrollY: 800,
    waitMs: 1000,
  },
  { id: "text-animation", file: "text-animation.html", waitMs: 1600 },
  {
    id: "collaboration-process",
    file: "collaboration-process.html",
    scrollY: 900,
    waitMs: 1400,
  },
  {
    id: "collaboration-process-steps",
    file: "collaboration-process-steps.html",
    scrollY: 700,
    waitMs: 1400,
  },
  {
    id: "horizontal-image-row",
    file: "horizontal-image-row.html",
    waitMs: 1600,
  },
  { id: "chroma-word-wipe", file: "chroma-word-wipe.html", waitMs: 1800 },
  { id: "marquee-cta-card", file: "marquee-cta-card.html", waitMs: 1200 },
  { id: "library-sidebar", file: "library-sidebar.html", waitMs: 900 },
  { id: "blob-tabs", file: "blob-tabs.html", waitMs: 900 },
  { id: "classic-tabs", file: "classic-tabs.html", waitMs: 900 },
];

const selectedDemos = process.env.DEMO_ID
  ? demos.filter((demo) => demo.id === process.env.DEMO_ID)
  : demos;

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  channel: "chrome",
});
const page = await browser.newPage({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1.5,
});

for (const demo of selectedDemos) {
  const url = `${base}/demos/${demo.file}`;
  console.log(`Capturing ${demo.id}…`);
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(async () => {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  });

  if (demo.scrollY != null) {
    const y =
      demo.scrollY === "max"
        ? await page.evaluate(() => document.body.scrollHeight)
        : demo.scrollY;
    await page.evaluate((scrollY) => {
      window.scrollTo(0, scrollY);
    }, y);
    await page.evaluate(() => {
      window.dispatchEvent(new Event("scroll"));
      if (window.ScrollTrigger) window.ScrollTrigger.update();
    });
  }

  if (demo.click) {
    const loc = page.locator(demo.click).first();
    if (await loc.count()) {
      await loc.click({ force: true }).catch(() => {});
    }
  }

  if (demo.prepare) await demo.prepare(page);

  await page.waitForTimeout(demo.waitMs ?? 800);

  const out = path.join(outDir, `${demo.id}.jpg`);
  await page.screenshot({
    path: out,
    type: "jpeg",
    quality: 82,
    fullPage: false,
  });
  console.log(`  → ${out}`);
}

await browser.close();
console.log("Done.");
