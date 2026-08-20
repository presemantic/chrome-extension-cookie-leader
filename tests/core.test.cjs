"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const CookieCore = require("../core.js");

const baseCookie = {
  name: "session",
  value: "abc",
  domain: ".example.com",
  path: "/app",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
  session: false,
  expirationDate: 2000000000,
  hostOnly: false,
  storeId: "0"
};

test("builds a stable identity including store and partition", () => {
  const first = CookieCore.cookieIdentity(baseCookie);
  const second = CookieCore.cookieIdentity({
    ...baseCookie,
    partitionKey: { topLevelSite: "https://top.example" }
  });

  assert.notEqual(first, second);
  assert.equal(first, "0||.example.com|/app|session");
});

test("builds an associated URL from cookie scope", () => {
  assert.equal(
    CookieCore.cookieUrl(baseCookie, "http://www.example.com/page"),
    "https://www.example.com/app"
  );
});

test("falls back to the cookie domain when the active host is unrelated", () => {
  assert.equal(
    CookieCore.cookieUrl(baseCookie, "https://unrelated.test/page"),
    "https://example.com/app"
  );
});

test("creates a secure host-only draft for an HTTPS site", () => {
  const draft = CookieCore.createDraft("https://www.example.com/page", "1");

  assert.equal(draft.domain, "www.example.com");
  assert.equal(draft.path, "/");
  assert.equal(draft.secure, true);
  assert.equal(draft.hostOnly, true);
  assert.equal(draft.storeId, "1");
});

test("accepts localhost and validates SameSite and partition requirements", () => {
  const localhost = CookieCore.createDraft("http://localhost:3000/");
  assert.equal(CookieCore.validateEditor(localhost).valid, true);

  const invalidSameSite = { ...localhost, sameSite: "no_restriction" };
  assert.equal(CookieCore.validateEditor(invalidSameSite).errors.sameSite, "SameSite=None requires Secure.");

  const invalidPartition = { ...localhost, partitioned: true };
  assert.ok(CookieCore.validateEditor(invalidPartition).errors.partitioned);
  assert.ok(CookieCore.validateEditor(invalidPartition).errors.partitionTopLevelSite);
});

test("omits domain and expiry for a host-only session cookie", () => {
  const draft = CookieCore.createDraft("https://www.example.com/");
  draft.name = "test";
  draft.value = "value";
  const details = CookieCore.buildSetDetails(draft, "https://www.example.com/");

  assert.equal(details.url, "https://www.example.com/");
  assert.equal(details.name, "test");
  assert.equal(details.domain, undefined);
  assert.equal(details.expirationDate, undefined);
});

test("includes persistent domain and partition details", () => {
  const editor = CookieCore.cookieToEditor({
    ...baseCookie,
    partitionKey: {
      topLevelSite: "https://top.example",
      hasCrossSiteAncestor: true
    }
  });
  const details = CookieCore.buildSetDetails(editor, "https://www.example.com/");

  assert.equal(details.domain, ".example.com");
  assert.equal(details.expirationDate, 2000000000);
  assert.deepEqual(details.partitionKey, {
    topLevelSite: "https://top.example",
    hasCrossSiteAncestor: true
  });
});

test("builds removal details with partition and store identity", () => {
  const details = CookieCore.buildRemoveDetails({
    ...baseCookie,
    partitionKey: { topLevelSite: "https://top.example" }
  }, "https://www.example.com/");

  assert.equal(details.name, "session");
  assert.equal(details.storeId, "0");
  assert.equal(details.url, "https://www.example.com/app");
  assert.deepEqual(details.partitionKey, { topLevelSite: "https://top.example" });
});

test("filters across name, value, domain, and path", () => {
  const cookies = [
    baseCookie,
    { ...baseCookie, name: "theme", value: "dark", domain: "ui.example.com", path: "/" }
  ];

  assert.equal(CookieCore.filterCookies(cookies, "dark").length, 1);
  assert.equal(CookieCore.filterCookies(cookies, "ui.example").length, 1);
  assert.equal(CookieCore.filterCookies(cookies, "app").length, 1);
  assert.equal(CookieCore.filterCookies(cookies, "").length, 2);
});

test("matches parent-domain and host-only cookies for the active host", () => {
  assert.equal(CookieCore.cookieMatchesHost({ domain: ".example.com" }, "www.example.com"), true);
  assert.equal(CookieCore.cookieMatchesHost({ domain: "www.example.com" }, "www.example.com"), true);
  assert.equal(CookieCore.cookieMatchesHost({ domain: "other.example.com" }, "www.example.com"), false);
});

test("sorts cookies by name, domain, and path", () => {
  const cookies = [
    { ...baseCookie, name: "z" },
    { ...baseCookie, name: "a", path: "/z" },
    { ...baseCookie, name: "a", path: "/a" }
  ];

  assert.deepEqual(
    CookieCore.sortCookies(cookies).map((cookie) => `${cookie.name}:${cookie.path}`),
    ["a:/a", "a:/z", "z:/app"]
  );
});

test("merges regular and partitioned cookie queries without duplicates", () => {
  const partitioned = {
    ...baseCookie,
    partitionKey: { topLevelSite: "https://top.example" }
  };

  assert.deepEqual(
    CookieCore.mergeCookies([baseCookie, partitioned], [partitioned]),
    [baseCookie, partitioned]
  );
});
