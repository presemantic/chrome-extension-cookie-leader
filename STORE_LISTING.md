# Chrome Web Store Listing

## Product details

- Name: `Header Leader - HTTP Cookies Editor`
- Language: `English`
- Category: `Developer Tools`
- Homepage: `https://www.presemantic.com/`
- Support: `https://github.com/presemantic/chrome-extension-cookie-leader/issues`
- Privacy policy: `https://github.com/presemantic/chrome-extension-cookie-leader/blob/main/PRIVACY.md`

## Summary

View, create, edit, delete, and restore cookies matching the active website in a compact Chrome toolbar popup.

## Detailed description

Header Leader - HTTP Cookies Editor gives developers a focused cookie editor directly from the Chrome toolbar.

The popup displays only cookies that match the exact URL of the active tab. Select a cookie to inspect or edit its name, value, domain, path, expiry, SameSite setting, Secure and HttpOnly flags, session state, host-only scope, cookie-store ID, and partition key.

Features:

- View cookies matching the active website
- Create and edit host-only or domain cookies
- Support for session, persistent, Secure, HttpOnly, SameSite, and partitioned cookies
- Delete one cookie or clear all cookies matching the active page
- Multi-level undo while the popup remains open
- Search and automatic refresh
- No analytics, tracking, remote code, or developer-side storage

Cookie data never leaves the local Chrome profile. Header Leader - HTTP Cookies Editor does not collect, log, transmit, sell, share, or remotely process cookie values, browsing activity, or website content.

## Single purpose

Provide a local editor for HTTP cookies matching the active browser tab.

## Permission justifications

### `cookies`

Required to read, create, edit, remove, and restore cookies selected by the user.

### `activeTab`

Required to identify the active page, select the correct Chrome cookie store, and scope every cookie query to the active URL.

### Optional HTTP(S) host access

Chrome checks cookie access against the cookie's own domain. Optional HTTP(S) host access is therefore required to expose parent-domain cookies, such as `.example.com` while visiting `www.example.com`. The extension still passes the exact active-tab URL to every cookie query and displays only matching cookies.

## Privacy disclosures

- Personally identifiable information: not collected
- Health information: not collected
- Financial and payment information: not collected
- Authentication information: processed locally only, not collected or transmitted
- Personal communications: not collected
- Location: not collected
- Web history: active tab URL processed locally only, not collected or transmitted
- User activity: not collected
- Website content: not collected
- Data sale or transfer: none
- Remote code: none
