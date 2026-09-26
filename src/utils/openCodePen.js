function extractTagContents(html, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const chunks = [];
  let match;
  while ((match = re.exec(html))) {
    chunks.push(match[1].trim());
  }
  return chunks;
}

function extractExternalScripts(html) {
  const re = /<script[^>]+src=["']([^"']+)["'][^>]*>\s*<\/script>/gi;
  const urls = [];
  let match;
  while ((match = re.exec(html))) {
    urls.push(match[1]);
  }
  return urls;
}

function extractExternalStyles(html) {
  const re = /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
  const urls = [];
  let match;
  while ((match = re.exec(html))) {
    urls.push(match[1]);
  }
  // also catch href-before-rel order
  const re2 =
    /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*>/gi;
  while ((match = re2.exec(html))) {
    if (!urls.includes(match[1])) urls.push(match[1]);
  }
  return urls;
}

function extractBody(html) {
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return match ? match[1].trim() : html;
}

function absolutizeAssetUrls(content, origin) {
  const base = `${origin}/demos/`;
  return content
    .replace(/(src|href)=(["'])\.\/assets\//gi, `$1=$2${base}assets/`)
    .replace(/(src|href)=(["'])assets\//gi, `$1=$2${base}assets/`)
    .replace(/(src|href)=(["'])\.\/(?!http)/gi, `$1=$2${base}`);
}

function parseDemoHtml(raw, origin) {
  const css = extractTagContents(raw, "style").join("\n\n");
  const js = extractTagContents(raw, "script")
    .filter((block) => block.length > 0)
    .join("\n\n");
  const html = absolutizeAssetUrls(extractBody(raw), origin);
  const js_external = extractExternalScripts(raw).join(";");
  const css_external = extractExternalStyles(raw).join(";");

  return {
    html: absolutizeAssetUrls(html, origin),
    css: absolutizeAssetUrls(css, origin),
    js,
    js_external,
    css_external,
  };
}

export async function openOnCodePen({ title, src }) {
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error(`Failed to load demo: ${src}`);
  }

  const raw = await response.text();
  const origin = window.location.origin;
  const parsed = parseDemoHtml(raw, origin);

  const data = {
    title: title || "UI Library Demo",
    description: "Exported from UI Library",
    html: parsed.html,
    css: parsed.css,
    js: parsed.js,
    js_external: parsed.js_external,
    css_external: parsed.css_external,
    editors: "111",
  };

  const form = document.createElement("form");
  form.action = "https://codepen.io/pen/define";
  form.method = "POST";
  form.target = "_blank";
  form.acceptCharset = "UTF-8";

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "data";
  input.value = JSON.stringify(data);

  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
  form.remove();
}
