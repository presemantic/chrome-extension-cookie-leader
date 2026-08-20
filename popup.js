"use strict";

const ALL_SITE_ORIGINS = ["http://*/*", "https://*/*"];

const elements = {
  saveStatus: document.querySelector("#saveStatus"),
  siteHost: document.querySelector("#siteHost"),
  undoDelete: document.querySelector("#undoDelete"),
  addCookie: document.querySelector("#addCookie"),
  cookieSearch: document.querySelector("#cookieSearch"),
  cookieCount: document.querySelector("#cookieCount"),
  cookieList: document.querySelector("#cookieList"),
  cookieListEmpty: document.querySelector("#cookieListEmpty"),
  cookieScrollbar: document.querySelector("#cookieScrollbar"),
  cookieScrollbarThumb: document.querySelector("#cookieScrollbarThumb"),
  clearCookies: document.querySelector("#clearCookies"),
  deleteCookie: document.querySelector("#deleteCookie"),
  editorEmpty: document.querySelector("#editorEmpty"),
  cookieForm: document.querySelector("#cookieForm"),
  accessState: document.querySelector("#accessState"),
  unsupportedState: document.querySelector("#unsupportedState"),
  grantAccess: document.querySelector("#grantAccess"),
  cookieName: document.querySelector("#cookieName"),
  cookieValue: document.querySelector("#cookieValue"),
  cookieDomain: document.querySelector("#cookieDomain"),
  cookiePath: document.querySelector("#cookiePath"),
  cookieSameSite: document.querySelector("#cookieSameSite"),
  cookieExpires: document.querySelector("#cookieExpires"),
  cookieSecure: document.querySelector("#cookieSecure"),
  cookieHttpOnly: document.querySelector("#cookieHttpOnly"),
  cookieSession: document.querySelector("#cookieSession"),
  cookieHostOnly: document.querySelector("#cookieHostOnly"),
  cookiePartitioned: document.querySelector("#cookiePartitioned"),
  partitionFields: document.querySelector("#partitionFields"),
  partitionTopLevelSite: document.querySelector("#partitionTopLevelSite"),
  hasCrossSiteAncestor: document.querySelector("#hasCrossSiteAncestor"),
  cookieStoreId: document.querySelector("#cookieStoreId"),
  cookieKind: document.querySelector("#cookieKind"),
  saveCookie: document.querySelector("#saveCookie"),
  domainError: document.querySelector("#domainError"),
  pathError: document.querySelector("#pathError"),
  sameSiteError: document.querySelector("#sameSiteError"),
  expirationError: document.querySelector("#expirationError"),
  partitionError: document.querySelector("#partitionError"),
  cookieItemTemplate: document.querySelector("#cookieItemTemplate")
};

const state = {
  tab: null,
  tabUrl: "",
  originPattern: "",
  storeId: "0",
  cookies: [],
  selectedKey: null,
  originalCookie: null,
  editor: null,
  deleteHistory: [],
  query: "",
  busy: false,
  clearGuardUntil: 0
};

function setStatus(message, tone = "normal") {
  elements.saveStatus.textContent = message;
  elements.saveStatus.dataset.tone = tone;
}

function createCustomScrollbar(scrollElement, track, thumb) {
  let pointerId = null;
  let startY = 0;
  let startTop = 0;

  function metrics() {
    const trackHeight = track.clientHeight;
    const viewportHeight = scrollElement.clientHeight;
    const contentHeight = scrollElement.scrollHeight;
    const hasOverflow = contentHeight > viewportHeight + 1;
    const thumbHeight = hasOverflow
      ? Math.max(36, trackHeight * (viewportHeight / contentHeight))
      : trackHeight;
    return {
      trackHeight,
      viewportHeight,
      contentHeight,
      hasOverflow,
      thumbHeight,
      maxThumbTop: Math.max(0, trackHeight - thumbHeight),
      maxScrollTop: Math.max(0, contentHeight - viewportHeight)
    };
  }

  function update() {
    const values = metrics();
    if (values.trackHeight <= 0) {
      return;
    }
    const top = values.hasOverflow && values.maxScrollTop > 0
      ? (scrollElement.scrollTop / values.maxScrollTop) * values.maxThumbTop
      : 0;
    track.classList.toggle("is-static", !values.hasOverflow);
    thumb.style.height = `${values.thumbHeight}px`;
    thumb.style.top = `${top}px`;
  }

  function scrollFromTop(top) {
    const values = metrics();
    if (!values.hasOverflow || values.maxThumbTop <= 0) {
      return;
    }
    const clamped = Math.max(0, Math.min(top, values.maxThumbTop));
    scrollElement.scrollTop = (clamped / values.maxThumbTop) * values.maxScrollTop;
  }

  function stop(event) {
    if (event.pointerId !== pointerId) {
      return;
    }
    if (thumb.hasPointerCapture(event.pointerId)) {
      thumb.releasePointerCapture(event.pointerId);
    }
    pointerId = null;
    thumb.classList.remove("is-dragging");
  }

  scrollElement.addEventListener("scroll", update);
  track.addEventListener("pointerdown", (event) => {
    if (event.target === thumb || thumb.contains(event.target)) {
      return;
    }
    const values = metrics();
    if (!values.hasOverflow) {
      return;
    }
    const bounds = track.getBoundingClientRect();
    scrollFromTop(event.clientY - bounds.top - values.thumbHeight / 2);
  });
  thumb.addEventListener("pointerdown", (event) => {
    const values = metrics();
    if (!values.hasOverflow) {
      return;
    }
    event.preventDefault();
    pointerId = event.pointerId;
    startY = event.clientY;
    startTop = Number.parseFloat(thumb.style.top || "0");
    thumb.setPointerCapture(event.pointerId);
    thumb.classList.add("is-dragging");
  });
  thumb.addEventListener("pointermove", (event) => {
    if (event.pointerId === pointerId) {
      scrollFromTop(startTop + event.clientY - startY);
    }
  });
  thumb.addEventListener("pointerup", stop);
  thumb.addEventListener("pointercancel", stop);
  window.addEventListener("resize", update);
  return { update };
}

const cookieScroller = createCustomScrollbar(
  elements.cookieList,
  elements.cookieScrollbar,
  elements.cookieScrollbarThumb
);

function secondsToLocalInput(seconds) {
  if (seconds == null) {
    return "";
  }
  const date = new Date(seconds * 1000);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function localInputToSeconds(value) {
  if (!value) {
    return null;
  }
  return Math.floor(new Date(value).getTime() / 1000);
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function originPattern(url) {
  return `${url.protocol}//${url.hostname}/*`;
}

async function cookieStoreForTab(tabId) {
  const stores = await chrome.cookies.getAllCookieStores();
  return stores.find((store) => store.tabIds.includes(tabId))?.id || "0";
}

function showSurface(name) {
  elements.editorEmpty.hidden = name !== "empty";
  elements.cookieForm.hidden = name !== "editor";
  elements.accessState.hidden = name !== "access";
  elements.unsupportedState.hidden = name !== "unsupported";
}

function currentCookie() {
  return state.cookies.find((cookie) => CookieCore.cookieIdentity(cookie) === state.selectedKey) || null;
}

function renderUndo() {
  const last = state.deleteHistory.at(-1);
  elements.undoDelete.disabled = !last;
  elements.undoDelete.title = last
    ? `Restore ${last.cookies.length} cookie${last.cookies.length === 1 ? "" : "s"}`
    : "Nothing to restore";
}

function renderList() {
  const filtered = CookieCore.sortCookies(
    CookieCore.filterCookies(state.cookies, state.query)
  );
  elements.cookieList.replaceChildren();
  elements.cookieCount.textContent = state.query
    ? `${filtered.length}/${state.cookies.length}`
    : String(state.cookies.length);
  elements.cookieListEmpty.hidden = filtered.length !== 0;
  elements.clearCookies.disabled = state.cookies.length === 0 || state.busy;

  filtered.forEach((cookie) => {
    const row = elements.cookieItemTemplate.content.firstElementChild.cloneNode(true);
    const key = CookieCore.cookieIdentity(cookie);
    row.dataset.cookieKey = key;
    row.classList.toggle("is-selected", key === state.selectedKey);
    row.querySelector(".cookie-name").textContent = cookie.name || "(empty name)";
    row.querySelector(".cookie-open").addEventListener("click", () => selectCookie(cookie));
    row.querySelector(".delete-cookie-row").addEventListener("click", () => deleteCookies([cookie]));
    elements.cookieList.append(row);
  });

  renderUndo();
  requestAnimationFrame(cookieScroller.update);
}

function renderValidation(validation) {
  const errors = validation?.errors || {};
  elements.domainError.textContent = errors.domain || "";
  elements.pathError.textContent = errors.path || "";
  elements.sameSiteError.textContent = errors.sameSite || "";
  elements.expirationError.textContent = errors.expirationDate || "";
  elements.partitionError.textContent = errors.partitionTopLevelSite || errors.partitioned || "";
}

function updateEditorDependencies() {
  elements.cookieExpires.disabled = elements.cookieSession.checked;
  elements.partitionFields.hidden = !elements.cookiePartitioned.checked;
  if (elements.cookiePartitioned.checked || elements.cookieSameSite.value === "no_restriction") {
    elements.cookieSecure.checked = true;
  }
  elements.cookieKind.textContent = elements.cookieHostOnly.checked ? "Host cookie" : "Domain cookie";
}

function renderEditor(editor, originalCookie) {
  state.editor = { ...editor };
  state.originalCookie = originalCookie;
  elements.cookieName.value = editor.name;
  elements.cookieValue.value = editor.value;
  elements.cookieDomain.value = editor.domain;
  elements.cookiePath.value = editor.path;
  elements.cookieSameSite.value = editor.sameSite;
  elements.cookieExpires.value = secondsToLocalInput(editor.expirationDate);
  elements.cookieSecure.checked = editor.secure;
  elements.cookieHttpOnly.checked = editor.httpOnly;
  elements.cookieSession.checked = editor.session;
  elements.cookieHostOnly.checked = editor.hostOnly;
  elements.cookiePartitioned.checked = editor.partitioned;
  elements.partitionTopLevelSite.value = editor.partitionTopLevelSite;
  elements.hasCrossSiteAncestor.checked = editor.hasCrossSiteAncestor;
  elements.cookieStoreId.textContent = editor.storeId;
  elements.deleteCookie.disabled = !originalCookie;
  renderValidation(null);
  updateEditorDependencies();
  showSurface("editor");
}

function readEditor() {
  return {
    name: elements.cookieName.value,
    value: elements.cookieValue.value,
    domain: elements.cookieDomain.value,
    path: elements.cookiePath.value,
    sameSite: elements.cookieSameSite.value,
    secure: elements.cookieSecure.checked,
    httpOnly: elements.cookieHttpOnly.checked,
    session: elements.cookieSession.checked,
    expirationDate: localInputToSeconds(elements.cookieExpires.value),
    hostOnly: elements.cookieHostOnly.checked,
    storeId: elements.cookieStoreId.textContent,
    partitioned: elements.cookiePartitioned.checked,
    partitionTopLevelSite: elements.partitionTopLevelSite.value,
    hasCrossSiteAncestor: elements.hasCrossSiteAncestor.checked
  };
}

function selectCookie(cookie) {
  state.selectedKey = CookieCore.cookieIdentity(cookie);
  renderEditor(CookieCore.cookieToEditor(cookie), cookie);
  renderList();
}

async function readCurrentPageCookies() {
  const details = {
    url: state.tabUrl,
    storeId: state.storeId
  };
  const unpartitioned = await chrome.cookies.getAll(details);
  let partitioned = [];
  try {
    const result = await chrome.cookies.getPartitionKey({
      tabId: state.tab.id,
      frameId: 0
    });
    if (result?.partitionKey) {
      partitioned = await chrome.cookies.getAll({
        ...details,
        partitionKey: result.partitionKey
      });
    }
  } catch {
    // Older Chrome versions do not support partition-key lookup.
  }
  return CookieCore.sortCookies(
    CookieCore.mergeCookies(unpartitioned, partitioned)
  );
}

async function refreshCookies({ preserveSelection = true } = {}) {
  state.cookies = await readCurrentPageCookies();
  if (!preserveSelection || !state.cookies.some((cookie) => CookieCore.cookieIdentity(cookie) === state.selectedKey)) {
    state.selectedKey = state.cookies[0] ? CookieCore.cookieIdentity(state.cookies[0]) : null;
  }
  const selected = currentCookie();
  if (selected) {
    renderEditor(CookieCore.cookieToEditor(selected), selected);
  } else if (!state.originalCookie) {
    showSurface("empty");
  }
  renderList();
}

async function initialize() {
  setStatus("LOADING");
  const tab = await activeTab();
  if (!tab?.url || !/^https?:\/\//.test(tab.url)) {
    state.tab = tab || null;
    state.tabUrl = "";
    elements.siteHost.textContent = "Unsupported page";
    showSurface("unsupported");
    setStatus("READY");
    return;
  }

  state.tab = tab;
  state.tabUrl = tab.url;
  const url = new URL(tab.url);
  state.originPattern = originPattern(url);
  state.storeId = await cookieStoreForTab(tab.id);
  elements.siteHost.textContent = url.hostname;
  elements.addCookie.disabled = false;
  elements.addCookie.title = "Add cookie for this website";

  const hasCookieAccess = await chrome.permissions.contains({
    origins: ALL_SITE_ORIGINS
  });
  if (!hasCookieAccess) {
    showSurface("access");
    setStatus("ACCESS", "error");
    return;
  }

  try {
    await refreshCookies({ preserveSelection: false });
    setStatus("READY");
  } catch (error) {
    showSurface("access");
    setStatus("ACCESS", "error");
  }
}

async function requestAccess() {
  const granted = await chrome.permissions.request({ origins: ALL_SITE_ORIGINS });
  if (!granted) {
    setStatus("DENIED", "error");
    return;
  }
  state.originalCookie = null;
  await refreshCookies({ preserveSelection: false });
  setStatus("READY");
}

async function removeSnapshot(cookie) {
  const details = CookieCore.buildRemoveDetails(cookie, state.tabUrl);
  const removed = await chrome.cookies.remove(details);
  if (removed) {
    return true;
  }

  if (!cookie.secure) {
    const alternateUrl = details.url.startsWith("https:")
      ? details.url.replace(/^https:/, "http:")
      : details.url.replace(/^http:/, "https:");
    const alternateRemoved = await chrome.cookies.remove({
      ...details,
      url: alternateUrl
    });
    if (alternateRemoved) {
      return true;
    }
  }

  const expiredEditor = CookieCore.cookieToEditor(cookie);
  expiredEditor.session = false;
  expiredEditor.expirationDate = 1;
  await chrome.cookies.set(CookieCore.buildSetDetails(expiredEditor, state.tabUrl));
  return true;
}

async function restoreSnapshot(cookie) {
  return chrome.cookies.set(
    CookieCore.buildSetDetails(CookieCore.cookieToEditor(cookie), state.tabUrl)
  );
}

async function deleteCookies(cookies, { guardRecreation = false } = {}) {
  if (state.busy || cookies.length === 0) {
    return;
  }
  state.busy = true;
  setStatus("DELETING");
  const attempted = new Map();
  const errors = [];
  try {
    if (guardRecreation) {
      state.clearGuardUntil = Date.now() + 3000;
    }

    let targets = cookies;
    const passCount = guardRecreation ? 4 : 1;
    for (let pass = 0; pass < passCount && targets.length > 0; pass += 1) {
      for (let offset = 0; offset < targets.length; offset += 50) {
        const batch = targets.slice(offset, offset + 50);
        const results = await Promise.allSettled(
          batch.map((cookie) => removeSnapshot(cookie))
        );
        results.forEach((result, index) => {
          const cookie = batch[index];
          if (result.status === "fulfilled" && result.value) {
            attempted.set(CookieCore.cookieIdentity(cookie), cookie);
          } else if (result.status === "rejected") {
            errors.push(result.reason);
          }
        });
      }

      if (guardRecreation) {
        await new Promise((resolve) => setTimeout(resolve, 120));
        targets = await readCurrentPageCookies();
      }
    }
    state.originalCookie = null;
    state.editor = null;
    await refreshCookies({ preserveSelection: false });

    const remainingKeys = new Set(state.cookies.map(CookieCore.cookieIdentity));
    const removed = [...attempted.values()].filter(
      (cookie) => !remainingKeys.has(CookieCore.cookieIdentity(cookie))
    );
    if (removed.length > 0) {
      state.deleteHistory.push({ cookies: removed });
    }
    const failedCount = state.cookies.length;
    if (failedCount > 0) {
      const reason = errors[0]?.message ? `: ${errors[0].message}` : "";
      setStatus(`${failedCount} NOT DELETED${reason}`, "error");
    } else {
      setStatus(guardRecreation ? "CLEARED — RELOAD TAB" : "SAVED");
    }
  } catch (error) {
    setStatus(error.message || "Delete failed", "error");
  } finally {
    state.busy = false;
    renderList();
  }
}

async function undoDelete() {
  const entry = state.deleteHistory.pop();
  if (!entry || state.busy) {
    return;
  }
  state.busy = true;
  setStatus("RESTORING");
  try {
    const restored = [];
    for (const cookie of entry.cookies) {
      const result = await restoreSnapshot(cookie);
      if (result) restored.push(result);
    }
    await refreshCookies({ preserveSelection: false });
    if (restored[0]) {
      const matching = state.cookies.find((cookie) => CookieCore.cookieIdentity(cookie) === CookieCore.cookieIdentity(restored[0]));
      if (matching) selectCookie(matching);
    }
    setStatus("SAVED");
  } catch (error) {
    state.deleteHistory.push(entry);
    setStatus(error.message || "Undo failed", "error");
  } finally {
    state.busy = false;
    renderList();
  }
}

async function saveCookie(event) {
  event.preventDefault();
  if (state.busy) {
    return;
  }
  const editor = readEditor();
  const validation = CookieCore.validateEditor(editor);
  renderValidation(validation);
  if (!validation.valid) {
    setStatus("CHECK FIELDS", "error");
    return;
  }

  state.busy = true;
  setStatus("SAVING");
  const original = state.originalCookie;
  try {
    if (original) {
      await removeSnapshot(original);
    }
    let saved;
    try {
      saved = await chrome.cookies.set(CookieCore.buildSetDetails(editor, state.tabUrl));
    } catch (error) {
      if (original) await restoreSnapshot(original);
      throw error;
    }
    state.originalCookie = null;
    await refreshCookies({ preserveSelection: false });
    if (saved) {
      const matching = state.cookies.find((cookie) => CookieCore.cookieIdentity(cookie) === CookieCore.cookieIdentity(saved));
      if (matching) selectCookie(matching);
    }
    setStatus("SAVED");
  } catch (error) {
    setStatus(error.message || "Save failed", "error");
  } finally {
    state.busy = false;
    renderList();
  }
}

elements.cookieSearch.addEventListener("input", () => {
  state.query = elements.cookieSearch.value;
  renderList();
});
elements.addCookie.addEventListener("click", () => {
  state.selectedKey = "__new__";
  renderEditor(CookieCore.createDraft(state.tabUrl, state.storeId), null);
  renderList();
  elements.cookieName.focus();
});
elements.clearCookies.addEventListener("click", () => deleteCookies(
  [...state.cookies],
  { guardRecreation: true }
));
elements.deleteCookie.addEventListener("click", () => {
  if (state.originalCookie) deleteCookies([state.originalCookie]);
});
elements.undoDelete.addEventListener("click", undoDelete);
elements.grantAccess.addEventListener("click", requestAccess);
elements.cookieForm.addEventListener("submit", saveCookie);
elements.cookieSession.addEventListener("change", updateEditorDependencies);
elements.cookieHostOnly.addEventListener("change", updateEditorDependencies);
elements.cookiePartitioned.addEventListener("change", updateEditorDependencies);
elements.cookieSameSite.addEventListener("change", updateEditorDependencies);

let cookieRefreshTimer = null;
chrome.cookies.onChanged.addListener((changeInfo) => {
  if (
    !changeInfo.removed
    && Date.now() < state.clearGuardUntil
    && state.tabUrl
    && String(changeInfo.cookie.storeId || "0") === state.storeId
    && CookieCore.cookieMatchesHost(changeInfo.cookie, new URL(state.tabUrl).hostname)
  ) {
    removeSnapshot(changeInfo.cookie).catch((error) => {
      setStatus(error.message || "Cookie was recreated", "error");
    });
    return;
  }
  if (state.busy || !state.tabUrl) {
    return;
  }
  clearTimeout(cookieRefreshTimer);
  cookieRefreshTimer = setTimeout(() => {
    refreshCookies().catch((error) => setStatus(error.message, "error"));
  }, 120);
});

initialize().catch((error) => {
  showSurface("access");
  setStatus(error.message || "Unable to load", "error");
});
