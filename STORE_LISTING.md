# Chrome Web Store Listing

## Product details

- Name: `Cookie Leader - HTTP Cookie Editor`
- Language: `English`
- Category: `Developer Tools`
- Homepage: `https://www.presemantic.com/`
- Support: `https://github.com/presemantic/chrome-extension-cookie-leader/issues`
- Privacy policy: `https://github.com/presemantic/chrome-extension-cookie-leader/blob/main/PRIVACY.md`

## Summary

View and edit cookies for the active website in Chrome: add, update, delete, search, clear, and restore cookies locally.

## Detailed description

Cookie Leader - HTTP Cookie Editor is a local cookie editor for Chrome developers. View and edit cookies for the active website without leaving the current tab.

The popup displays only cookies that match the exact URL of the active tab. Select a cookie to inspect or edit its name, value, domain, path, expiry, SameSite setting, Secure and HttpOnly flags, session state, host-only scope, cookie-store ID, and partition key.

Features:

- View cookies matching the active website
- Create and edit host-only or domain cookies
- Support for session, persistent, Secure, HttpOnly, SameSite, and partitioned cookies
- Delete one cookie or clear all cookies matching the active page
- Multi-level undo while the popup remains open
- Search and automatic refresh
- No analytics, tracking, remote code, or developer-side storage

Use it to debug sessions, inspect cookie scope, test SameSite behavior, and work with secure or partitioned cookies.

Cookie data never leaves the local Chrome profile. Cookie Leader - HTTP Cookie Editor does not collect, log, transmit, sell, share, or remotely process cookie values, browsing activity, or website content.

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

## Graphic assets

- Store icon: `icons/icon-128.png` (128x128 PNG)
- Screenshots:
  - `assets/screenshot-1280x800.png`
  - `assets/cookie-search-1280x800.png`
  - `assets/cookie-create-1280x800.png`
  - `assets/cookie-partitioned-1280x800.png`
  - `assets/cookie-access-1280x800.png`
- Small promo tile: `assets/small.png` (440x280 PNG)
- Marquee promo tile: `assets/merquee.png` (1400x560 PNG)
