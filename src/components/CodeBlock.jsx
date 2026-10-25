import { useState } from "react";

const JS_KEYWORDS = new Set(
  "const let var function return if else for while do new class extends import export from async await try catch finally throw typeof instanceof this true false null undefined of in break continue switch case default yield void delete super static get set".split(
    " "
  )
);

function scan(code, re, typeOf) {
  const tokens = [];
  let last = 0;
  re.lastIndex = 0;
  let match = re.exec(code);
  while (match) {
    if (match.index > last) {
      tokens.push({ type: "", value: code.slice(last, match.index) });
    }
    tokens.push({ type: typeOf(match[0]), value: match[0] });
    last = match.index + match[0].length;
    match = re.exec(code);
  }
  if (last < code.length) {
    tokens.push({ type: "", value: code.slice(last) });
  }
  return tokens;
}

function highlightHtml(code) {
  return scan(
    code,
    /<!--[\s\S]*?-->|<\/?[A-Za-z][\w:.-]*|"[^"]*"|'[^']*'|[\w:.-]+(?=\s*=)|\/?>/g,
    (value) => {
      if (value.startsWith("<!--")) return "comment";
      if (value.startsWith("<")) return "tag";
      if (value.startsWith('"') || value.startsWith("'")) return "string";
      if (value === ">" || value === "/>") return "punctuation";
      return "attr";
    }
  );
}

function highlightCss(code) {
  return scan(
    code,
    /\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|@[a-zA-Z-]+|::?[a-zA-Z-]+(?:\([^)]*\))?|#[\w-]+|\.[\w-]+|\b[\w-]+(?=\s*:)|\b\d*\.?\d+(?:px|em|rem|vh|vw|vmin|vmax|%|s|ms|deg|fr|ch|ex)?\b/g,
    (value) => {
      if (value.startsWith("/*")) return "comment";
      if (value.startsWith('"') || value.startsWith("'")) return "string";
      if (value.startsWith("@")) return "atrule";
      if (value.startsWith(":") || value.startsWith("#") || value.startsWith(".")) return "selector";
      if (/^\d/.test(value) || value.startsWith(".")) return "number";
      return "property";
    }
  );
}

function highlightJs(code) {
  return scan(
    code,
    /\/\*[\s\S]*?\*\/|\/\/[^\n]*|`(?:\\[\s\S]|[^\\`])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:const|let|var|function|return|if|else|for|while|do|new|class|extends|import|export|from|async|await|try|catch|finally|throw|typeof|instanceof|this|true|false|null|undefined|of|in|break|continue|switch|case|default|yield|void|delete|super|static|get|set)\b|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*(?=\s*\()/g,
    (value) => {
      if (value.startsWith("/*") || value.startsWith("//")) return "comment";
      if (value.startsWith("`") || value.startsWith('"') || value.startsWith("'")) return "string";
      if (/^\d/.test(value)) return "number";
      if (JS_KEYWORDS.has(value)) return "keyword";
      return "function";
    }
  );
}

const HIGHLIGHT = {
  HTML: highlightHtml,
  CSS: highlightCss,
  JavaScript: highlightJs,
};

export default function CodeBlock({ label, code }) {
  const [copied, setCopied] = useState(false);
  const tokens = code ? (HIGHLIGHT[label]?.(code) ?? [{ type: "", value: code }]) : null;

  async function copyCode() {
    if (!code || copied) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const area = document.createElement("textarea");
        area.value = code;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.left = "-9999px";
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand("copy");
        area.remove();
        if (!ok) return;
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <section className="modal__code">
      <div className="modal__code-head">
        <h3>{label}</h3>
        <button
          className={`modal__code-copy${copied ? " is-copied" : ""}`}
          type="button"
          aria-label={copied ? `${label} copied` : `Copy ${label}`}
          onClick={copyCode}
          disabled={!code}
        >
          <span className="modal__code-copy-track" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
              <path d="M10.5 5.5V3.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1H5.5" />
            </svg>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3.5 8.5l3 3 6-6.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      </div>
      <pre>
        <code>
          {tokens
            ? tokens.map((token, index) =>
                token.type ? (
                  <span key={index} className={`tok tok--${token.type}`}>
                    {token.value}
                  </span>
                ) : (
                  <span key={index}>{token.value}</span>
                )
              )
            : "Loading…"}
        </code>
      </pre>
    </section>
  );
}
