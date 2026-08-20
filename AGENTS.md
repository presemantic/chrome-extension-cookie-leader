# Header Leader - HTTP Cookies Editor

## Purpose

This project is a dependency-free Chrome Manifest V3 extension for viewing and editing cookies that match the exact URL of the active web tab. The interface is English-only and follows the established Header Leader visual language: warm neutral surfaces, dark editorial typography, lime/cyan branding, compact square actions, inverted row hover, thin rules, and custom scrollbars.

## Structure

- `manifest.json` declares the toolbar popup, cookie/active-tab permissions, optional HTTP(S) host access, homepage, and icon assets.
- `core.js` contains pure cookie identity, URL, validation, filtering, sorting, display, set-details, and remove-details helpers shared by the popup and tests.
- `popup.html`, `popup.css`, and `popup.js` implement the active-page cookie list and full selected-cookie editor.
- `icons/` contains the editable SVG source plus Chrome-required PNG sizes.
- `tests/` contains dependency-free Node tests for cookie transformations and static UI contracts.
- `PRIVACY.md` is the public Chrome Web Store privacy policy.
- `STORE_LISTING.md` contains the canonical English listing copy, permission justifications, and privacy disclosures.
- `store-assets/render-screenshot.mjs` renders the required 1280x800 Web Store screenshot with fictional cookie data; its generated PNG is stored beside it.
- `LICENSE` contains the MIT license.

## Constraints

Keep the extension dependency-free and request only the permissions required by its single purpose. Chrome's cookie API checks host permission against a cookie's own domain, so a page such as `www.example.com` cannot expose a `.example.com` cookie under an exact-host grant. Request optional HTTP(S) all-sites access only after the user explicitly grants it, then enforce current-page scope in every query and UI surface by always passing the active URL to `chrome.cookies.getAll`. Never collect, log, sync, transmit to the developer, or remotely process cookie names, values, browsing activity, or site content.

Cookie deletion is immediate and recoverable through a session-local multi-level UNDO stack. A single delete restores the exact cookie; Clear all covers every cookie matching the active page URL, stores and restores the full batch, retries deletion, briefly removes recreated matching cookies, verifies the final page-scoped result, and tells the user to reload the tab so the page drops any in-memory session state. Enumeration must merge matching unpartitioned cookies with cookies using the active tab's exact partition key and deduplicate by full cookie identity. Editing an existing cookie must preserve its original snapshot and restore it if a remove-then-set update fails. Support host-only/domain cookies, session/persistent expiry, Secure, HttpOnly, SameSite, store IDs, and partition keys.

Verification must be static and must not inspect or mutate real browser cookies unless the user explicitly asks for live runtime testing. Run JavaScript syntax checks, focused Node tests, manifest/resource checks, archive inspection, and diff review.
