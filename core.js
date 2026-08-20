(function attachCookieCore(globalScope) {
  "use strict";

  const SAME_SITE_VALUES = new Set([
    "unspecified",
    "no_restriction",
    "lax",
    "strict"
  ]);

  function stripLeadingDot(domain) {
    return String(domain || "").replace(/^\./, "").toLowerCase();
  }

  function normalizePath(path) {
    const value = String(path || "/").trim();
    return value.startsWith("/") ? value : `/${value}`;
  }

  function cookieIdentity(cookie) {
    const partition = cookie?.partitionKey
      ? `${cookie.partitionKey.topLevelSite || ""}:${cookie.partitionKey.hasCrossSiteAncestor ? "1" : "0"}`
      : "";
    return [
      cookie?.storeId || "0",
      partition,
      String(cookie?.domain || "").toLowerCase(),
      normalizePath(cookie?.path),
      String(cookie?.name || "")
    ].join("|");
  }

  function cookieUrl(cookie, currentUrl) {
    let current;
    try {
      current = new URL(currentUrl || "https://example.invalid/");
    } catch {
      current = new URL("https://example.invalid/");
    }

    const cookieHost = stripLeadingDot(cookie?.domain);
    const currentHost = stripLeadingDot(current.hostname);
    const cookieAppliesToCurrentHost = Boolean(cookieHost)
      && (currentHost === cookieHost || currentHost.endsWith(`.${cookieHost}`));
    const host = cookieAppliesToCurrentHost
      ? current.hostname
      : (cookieHost || current.hostname);
    const scheme = cookie?.secure
      ? "https:"
      : (["http:", "https:"].includes(current.protocol) ? current.protocol : "http:");
    return `${scheme}//${host}${normalizePath(cookie?.path)}`;
  }

  function cookieToEditor(cookie) {
    return {
      name: String(cookie?.name || ""),
      value: String(cookie?.value || ""),
      domain: String(cookie?.domain || ""),
      path: normalizePath(cookie?.path),
      sameSite: SAME_SITE_VALUES.has(cookie?.sameSite) ? cookie.sameSite : "unspecified",
      secure: cookie?.secure === true,
      httpOnly: cookie?.httpOnly === true,
      session: cookie?.session !== false || cookie?.expirationDate == null,
      expirationDate: cookie?.expirationDate ?? null,
      hostOnly: cookie?.hostOnly !== false,
      storeId: String(cookie?.storeId || "0"),
      partitioned: Boolean(cookie?.partitionKey),
      partitionTopLevelSite: cookie?.partitionKey?.topLevelSite || "",
      hasCrossSiteAncestor: cookie?.partitionKey?.hasCrossSiteAncestor === true
    };
  }

  function createDraft(currentUrl, storeId = "0") {
    const url = new URL(currentUrl);
    return {
      name: "",
      value: "",
      domain: url.hostname,
      path: "/",
      sameSite: "unspecified",
      secure: url.protocol === "https:",
      httpOnly: false,
      session: true,
      expirationDate: null,
      hostOnly: true,
      storeId: String(storeId),
      partitioned: false,
      partitionTopLevelSite: "",
      hasCrossSiteAncestor: false
    };
  }

  function validateEditor(editor) {
    const errors = {};
    const domain = stripLeadingDot(editor?.domain);
    const path = normalizePath(editor?.path);

    if (!domain || /\s/.test(domain)) {
      errors.domain = "Enter a valid cookie domain.";
    }
    if (!path.startsWith("/")) {
      errors.path = "Path must start with /.";
    }
    if (editor?.sameSite === "no_restriction" && !editor?.secure) {
      errors.sameSite = "SameSite=None requires Secure.";
    }
    if (editor?.partitioned && !editor?.secure) {
      errors.partitioned = "Partitioned cookies require Secure.";
    }
    if (editor?.partitioned && !editor?.partitionTopLevelSite) {
      errors.partitionTopLevelSite = "Enter the top-level site for the partition.";
    } else if (editor?.partitioned) {
      try {
        const partitionUrl = new URL(editor.partitionTopLevelSite);
        if (!/^https?:$/.test(partitionUrl.protocol)) {
          errors.partitionTopLevelSite = "Use an HTTP or HTTPS top-level site.";
        }
      } catch {
        errors.partitionTopLevelSite = "Enter a valid top-level site URL.";
      }
    }
    if (!editor?.session) {
      const expirationDate = Number(editor?.expirationDate);
      if (!Number.isFinite(expirationDate) || expirationDate <= 0) {
        errors.expirationDate = "Choose a valid expiration date.";
      }
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  function buildSetDetails(editor, currentUrl) {
    const validation = validateEditor(editor);
    if (!validation.valid) {
      const error = new Error("Invalid cookie details.");
      error.validation = validation;
      throw error;
    }

    const details = {
      url: cookieUrl(editor, currentUrl),
      name: String(editor.name || ""),
      value: String(editor.value || ""),
      path: normalizePath(editor.path),
      secure: editor.secure === true,
      httpOnly: editor.httpOnly === true,
      sameSite: SAME_SITE_VALUES.has(editor.sameSite) ? editor.sameSite : "unspecified",
      storeId: String(editor.storeId || "0")
    };

    if (!editor.hostOnly) {
      details.domain = String(editor.domain || "").trim();
    }
    if (!editor.session) {
      details.expirationDate = Number(editor.expirationDate);
    }
    if (editor.partitioned) {
      details.partitionKey = {
        topLevelSite: String(editor.partitionTopLevelSite)
      };
      if (editor.hasCrossSiteAncestor) {
        details.partitionKey.hasCrossSiteAncestor = true;
      }
    }

    return details;
  }

  function buildRemoveDetails(cookie, currentUrl) {
    const details = {
      url: cookieUrl(cookie, currentUrl),
      name: String(cookie?.name || ""),
      storeId: String(cookie?.storeId || "0")
    };
    if (cookie?.partitionKey) {
      details.partitionKey = { ...cookie.partitionKey };
    }
    return details;
  }

  function filterCookies(cookies, query) {
    const needle = String(query || "").trim().toLowerCase();
    if (!needle) {
      return [...cookies];
    }
    return cookies.filter((cookie) => [
      cookie.name,
      cookie.value,
      cookie.domain,
      cookie.path
    ].some((value) => String(value || "").toLowerCase().includes(needle)));
  }

  function cookieMatchesHost(cookie, hostname) {
    const cookieDomain = stripLeadingDot(cookie?.domain);
    const host = stripLeadingDot(hostname);
    return Boolean(cookieDomain)
      && (host === cookieDomain || host.endsWith(`.${cookieDomain}`));
  }

  function sortCookies(cookies) {
    return [...cookies].sort((left, right) => (
      left.name.localeCompare(right.name)
      || left.domain.localeCompare(right.domain)
      || left.path.localeCompare(right.path)
    ));
  }

  function mergeCookies(...groups) {
    const cookies = new Map();
    groups.flat().forEach((cookie) => {
      cookies.set(cookieIdentity(cookie), cookie);
    });
    return [...cookies.values()];
  }

  function formatExpiration(expirationDate) {
    if (expirationDate == null) {
      return "Session";
    }
    return new Date(expirationDate * 1000).toLocaleString();
  }

  const api = {
    stripLeadingDot,
    normalizePath,
    cookieIdentity,
    cookieUrl,
    cookieToEditor,
    createDraft,
    validateEditor,
    buildSetDetails,
    buildRemoveDetails,
    filterCookies,
    cookieMatchesHost,
    sortCookies,
    mergeCookies,
    formatExpiration
  };

  globalScope.CookieCore = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
