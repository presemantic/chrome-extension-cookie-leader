import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "store-assets", "screenshot-1280x800.png");

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

const cookieRows = [
  cookieRow("session_id", true),
  cookieRow("theme"),
  cookieRow("locale"),
  cookieRow("consent")
].join("");

const popupBody = bodyMatch[1]
  .replace('src="icons/icon-32.png"', `src="${iconData}"`)
  .replace("<span id=\"siteHost\" class=\"site-host\">Current site</span>", "<span id=\"siteHost\" class=\"site-host\">app.example.com</span>")
  .replace("<span id=\"cookieCount\" class=\"cookie-count\">0</span>", "<span id=\"cookieCount\" class=\"cookie-count\">4</span>")
  .replace('<div id="cookieList" class="cookie-list" role="list"></div>', `<div id="cookieList" class="cookie-list" role="list">${cookieRows}</div>`)
  .replace('<div id="editorEmpty" class="editor-empty">', '<div id="editorEmpty" class="editor-empty" hidden>')
  .replace('<form id="cookieForm" class="cookie-form" hidden>', '<form id="cookieForm" class="cookie-form">')
  .replace('id="cookieName" type="text"', 'id="cookieName" type="text" value="session_id"')
  .replace('<textarea id="cookieValue" rows="3" spellcheck="false"></textarea>', '<textarea id="cookieValue" rows="3" spellcheck="false">demo-session-token</textarea>')
  .replace('id="cookieDomain" type="text"', 'id="cookieDomain" type="text" value="app.example.com"')
  .replace('id="cookiePath" type="text"', 'id="cookiePath" type="text" value="/"')
  .replace('id="cookieSecure" type="checkbox"', 'id="cookieSecure" type="checkbox" checked')
  .replace('id="cookieHttpOnly" type="checkbox"', 'id="cookieHttpOnly" type="checkbox" checked')
  .replace('id="cookieSession" type="checkbox"', 'id="cookieSession" type="checkbox" checked')
  .replace('id="cookieHostOnly" type="checkbox"', 'id="cookieHostOnly" type="checkbox" checked');

const screenshotHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      ${popupCss}
      html, body {
        width: 1280px !important;
        height: 800px !important;
        background: #172518 !important;
      }
      body {
        display: flex !important;
        align-items: center;
        justify-content: center;
        background: radial-gradient(circle at 20% 10%, #2b472e 0, #172518 44%, #0d160f 100%) !important;
      }
      .shot-shell {
        width: 800px;
        height: 600px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        background: #f2f0e9;
        box-shadow: 0 30px 90px rgba(0, 0, 0, 0.48);
      }
      .delete-cookie-row svg,
      .delete-cookie svg,
      .clear-action svg {
        fill: none;
        stroke: currentColor;
      }
    </style>
  </head>
  <body><div class="shot-shell">${popupBody}</div></body>
</html>`;

const browser = await chromium.launch({
  executablePath: process.env.CHROME_EXECUTABLE_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.setContent(screenshotHtml, { waitUntil: "load" });
const screenshot = await page.screenshot({ type: "png" });
await writeFile(output, screenshot);
await browser.close();

console.log(output);
