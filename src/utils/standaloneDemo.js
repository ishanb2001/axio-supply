function styleBlocks(html) {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

function isImportMap(attrs) {
  return /type=["']importmap["']/i.test(attrs);
}

export function splitDemoSource(html) {
  const css = styleBlocks(html).join("\n\n");
  const js = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter((match) => !/\bsrc=/i.test(match[1]) && !isImportMap(match[1]))
    .map((match) => match[2].trim())
    .filter(Boolean)
    .join("\n\n");
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  const withoutStyles = withoutScripts.replace(/<style[\s\S]*?<\/style>/gi, "");
  const body = withoutStyles.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const markup = (body ? body[1] : withoutStyles).trim();
  return { html: markup, css, js };
}

function stylesheetHref(tag) {
  if (!/rel=["']stylesheet["']/i.test(tag) && !/stylesheet/i.test(tag)) return "";
  return tag.match(/href=["']([^"']+)["']/i)?.[1] || "";
}

function isRemote(value) {
  return /^(https?:|data:|blob:|mailto:|#|javascript:)/i.test(value);
}

async function readText(url) {
  const response = await fetch(url);
  if (!response.ok) return "";
  return response.text();
}

function absolutize(content, baseUrl) {
  const origin = new URL(baseUrl).origin;
  let next = content.replace(/(src|href)=(["'])([^"']+)\2/gi, (all, attr, quote, value) => {
    if (isRemote(value)) return all;
    try {
      return `${attr}=${quote}${new URL(value, baseUrl).href}${quote}`;
    } catch {
      return all;
    }
  });
  next = next.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (all, quote, value) => {
    const target = value.trim();
    if (isRemote(target)) return all;
    try {
      return `url(${quote}${new URL(target, baseUrl).href}${quote})`;
    } catch {
      return all;
    }
  });
  next = next.replace(/(["'`])\/(?!\/)/g, `$1${origin}/`);
  return next;
}

async function inlineLocalAssets(raw, demoUrl) {
  let html = raw;
  const origin = new URL(demoUrl).origin;

  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);
  for (const tag of links) {
    const href = stylesheetHref(tag);
    if (!href || isRemote(href)) continue;
    const absolute = new URL(href, demoUrl).href;
    if (new URL(absolute).origin !== origin) continue;
    const css = absolutize(await readText(absolute), absolute);
    html = html.replace(tag, `<style>\n${css}\n</style>`);
  }

  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  for (const match of scripts) {
    const attrs = match[1];
    const src = attrs.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    if (!src || isRemote(src)) continue;
    const absolute = new URL(src, demoUrl).href;
    if (new URL(absolute).origin !== origin) continue;
    const code = (await readText(absolute)).replace(/<\/script/gi, "<\\/script");
    const type = attrs.match(/\btype=["']([^"']+)["']/i)?.[1];
    const typeAttr = type && type !== "text/javascript" ? ` type="${type}"` : "";
    html = html.replace(match[0], `<script${typeAttr}>\n${code}\n</script>`);
  }

  return html;
}

export async function prepareDemoSource(raw, demoUrl) {
  const standalone = absolutize(await inlineLocalAssets(raw, demoUrl), demoUrl).trim();
  return { ...splitDemoSource(standalone), standalone };
}
