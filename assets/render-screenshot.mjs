import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const popupHtml = await readFile(path.join(root, "popup.html"), "utf8");
const popupCss = await readFile(path.join(root, "popup.css"), "utf8");
const icon = await readFile(path.join(root, "icons", "icon-32.png"));
const iconData = `data:image/png;base64,${icon.toString("base64")}`;
const bodyMatch = popupHtml.match(/<body>([\s\S]*?)<script src="core\.js"><\/script>/);

if (!bodyMatch) {
  throw new Error("Unable to extract popup body.");
}

const cookieRow = (name, selected = false) => `
  <div class="cookie-item${selected ? " is-selected" : ""}" role="listitem">
    <button class="cookie-open" type="button"><span class="cookie-name">${name}</span></button>
    <button class="delete-cookie-row" type="button" aria-label="Delete cookie">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5"/></svg>
    </button>
  </div>`;

function baseBody({ host = "app.example.com", rows = [], count = rows.length, search = "" } = {}) {
  return bodyMatch[1]
    .replace('src="icons/icon-32.png"', `src="${iconData}"`)
    .replace('<span id="siteHost" class="site-host">Current site</span>', `<span id="siteHost" class="site-host">${host}</span>`)
    .replace('<span id="cookieCount" class="cookie-count">0</span>', `<span id="cookieCount" class="cookie-count">${count}</span>`)
    .replace('id="cookieSearch" class="search-input" type="search"', `id="cookieSearch" class="search-input" type="search" value="${search}"`)
    .replace('<div id="cookieList" class="cookie-list" role="list"></div>', `<div id="cookieList" class="cookie-list" role="list">${rows.join("")}</div>`);
}

function showForm(body, values = {}) {
  const {
    name = "session_id",
    value = "demo-session-token",
    domain = "app.example.com",
    cookiePath = "/",
    sameSite = "unspecified",
    secure = true,
    httpOnly = true,
    session = true,
    hostOnly = true,
    partitioned = false,
    partitionTopLevelSite = "https://example.com"
  } = values;

  let result = body
    .replace('<div id="editorEmpty" class="editor-empty">', '<div id="editorEmpty" class="editor-empty" hidden>')
    .replace('<form id="cookieForm" class="cookie-form" hidden>', '<form id="cookieForm" class="cookie-form">')
    .replace('id="cookieName" type="text"', `id="cookieName" type="text" value="${name}"`)
    .replace('<textarea id="cookieValue" rows="3" spellcheck="false"></textarea>', `<textarea id="cookieValue" rows="3" spellcheck="false">${value}</textarea>`)
    .replace('id="cookieDomain" type="text"', `id="cookieDomain" type="text" value="${domain}"`)
    .replace('id="cookiePath" type="text"', `id="cookiePath" type="text" value="${cookiePath}"`)
    .replace(`<option value="${sameSite}">`, `<option value="${sameSite}" selected>`);

  if (secure) result = result.replace('id="cookieSecure" type="checkbox"', 'id="cookieSecure" type="checkbox" checked');
  if (httpOnly) result = result.replace('id="cookieHttpOnly" type="checkbox"', 'id="cookieHttpOnly" type="checkbox" checked');
  if (session) result = result.replace('id="cookieSession" type="checkbox"', 'id="cookieSession" type="checkbox" checked');
  if (hostOnly) result = result.replace('id="cookieHostOnly" type="checkbox"', 'id="cookieHostOnly" type="checkbox" checked');
  if (partitioned) {
    result = result
      .replace('id="cookiePartitioned" type="checkbox"', 'id="cookiePartitioned" type="checkbox" checked')
      .replace('<div id="partitionFields" class="partition-fields" hidden>', '<div id="partitionFields" class="partition-fields">')
      .replace('id="partitionTopLevelSite" type="url"', `id="partitionTopLevelSite" type="url" value="${partitionTopLevelSite}"`);
  }

  return result;
}

const standardRows = [cookieRow("session_id", true), cookieRow("theme"), cookieRow("locale"), cookieRow("consent")];
const scenarios = [
  { file: "screenshot-1280x800.png", body: showForm(baseBody({ rows: standardRows })) },
  {
    file: "cookie-search-1280x800.png",
    body: showForm(baseBody({ rows: [cookieRow("session_id", true), cookieRow("session_refresh")], count: 2, search: "session" }))
  },
  {
    file: "cookie-create-1280x800.png",
    body: showForm(baseBody({ rows: standardRows }), { name: "feature_preview", value: "enabled", sameSite: "lax", httpOnly: false }).replace("Save cookie", "Create cookie")
  },
  {
    file: "cookie-partitioned-1280x800.png",
    body: showForm(baseBody({ rows: [cookieRow("partitioned_session", true), cookieRow("theme"), cookieRow("consent")] }), {
      name: "partitioned_session",
      value: "partition-demo",
      domain: ".example.com",
      hostOnly: false,
      partitioned: true
    })
  },
  {
    file: "cookie-access-1280x800.png",
    body: baseBody({ rows: [], count: 0 })
      .replace('<div id="editorEmpty" class="editor-empty">', '<div id="editorEmpty" class="editor-empty" hidden>')
      .replace('<div id="accessState" class="access-state" hidden>', '<div id="accessState" class="access-state">')
  }
];

const browser = await chromium.launch({
  executablePath: process.env.CHROME_EXECUTABLE_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true
});

for (const scenario of scenarios) {
  const screenshotHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
    ${popupCss}
    html, body { width: 1280px !important; height: 800px !important; }
    body { display: flex !important; align-items: center; justify-content: center; background: radial-gradient(circle at 20% 10%, #2b472e 0, #172518 44%, #0d160f 100%) !important; }
    .shot-shell { width: 800px; height: 600px; border: 1px solid rgba(255,255,255,.16); background: #f2f0e9; box-shadow: 0 30px 90px rgba(0,0,0,.48); }
    .delete-cookie-row svg, .delete-cookie svg, .clear-action svg { fill: none; stroke: currentColor; }
  </style></head><body><div class="shot-shell">${scenario.body}</div></body></html>`;
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.setContent(screenshotHtml, { waitUntil: "load" });
  await writeFile(path.join(root, "assets", scenario.file), await page.screenshot({ type: "png" }));
  await page.close();
}

await browser.close();
console.log(scenarios.map(({ file }) => path.join(root, "assets", file)).join("\n"));
