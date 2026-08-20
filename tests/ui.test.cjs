"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");

test("manifest exposes the popup and optional site-scoped cookie permissions", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));

  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.name, "Header Leader - HTTP Cookies Editor");
  assert.equal(manifest.action.default_popup, "popup.html");
  assert.equal(manifest.action.default_title, "Header Leader - HTTP Cookies Editor");
  assert.ok(manifest.permissions.includes("cookies"));
  assert.ok(manifest.permissions.includes("activeTab"));
  assert.equal(manifest.permissions.includes("storage"), false);
  assert.equal(manifest.host_permissions, undefined);
  assert.deepEqual(manifest.optional_host_permissions, ["http://*/*", "https://*/*"]);
});

test("popup includes cookie CRUD, undo, clear-all, editor, and access controls", () => {
  const html = fs.readFileSync(path.join(root, "popup.html"), "utf8");
  const script = fs.readFileSync(path.join(root, "popup.js"), "utf8");
  const requiredIds = [
    "undoDelete",
    "addCookie",
    "clearCookies",
    "deleteCookie",
    "cookieForm",
    "saveCookie",
    "grantAccess",
    "cookieScrollbar",
    "cookieScrollbarThumb"
  ];

  requiredIds.forEach((id) => assert.ok(html.includes(`id="${id}"`), id));
  assert.equal(html.includes("cookie-value-preview"), false);
  assert.equal(html.includes("cookie-meta"), false);
  assert.equal(html.includes("cookie-flags"), false);
  assert.ok(script.includes("state.deleteHistory.push"));
  assert.ok(script.includes("chrome.cookies.remove"));
  assert.ok(script.includes("chrome.cookies.set"));
  assert.ok(script.includes("expiredEditor.expirationDate = 1"));
  assert.ok(script.includes("remainingKeys"));
  assert.ok(script.includes("clearGuardUntil"));
  assert.ok(script.includes("const passCount = guardRecreation ? 4 : 1"));
  assert.ok(script.includes('const ALL_SITE_ORIGINS = ["http://*/*", "https://*/*"]'));
  assert.ok(script.includes("async function readCurrentPageCookies()"));
  assert.ok(script.includes("chrome.cookies.getAll(details)"));
  assert.ok(script.includes("chrome.cookies.getPartitionKey"));
  assert.ok(script.includes("partitionKey: result.partitionKey"));
  assert.ok(script.includes("targets = await readCurrentPageCookies()"));
  assert.ok(script.includes("Promise.allSettled"));
  assert.ok(script.includes("CLEARED — RELOAD TAB"));
  assert.ok(script.includes("chrome.permissions.contains"));
  assert.ok(script.includes("chrome.permissions.request"));
  assert.equal(script.includes("chrome.permissions.remove"), false);
  assert.ok(html.includes("No cookies for this page."));
  assert.ok(html.includes("Chrome requires all-sites permission"));
  assert.ok(html.includes("Allow cookie access"));
});
