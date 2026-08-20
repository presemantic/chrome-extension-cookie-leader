# Header Leader - HTTP Cookies Editor

Cookie Leader is a dependency-free Chrome Manifest V3 extension for viewing, adding, editing, deleting, clearing, and restoring cookies that match the exact URL of the active website tab. After clearing cookies, reload the website tab so its already-running page drops any session state held in memory.

## Features

- Active-page cookie list with search and automatic refresh.
- Full editing of name, value, domain, path, expiry, SameSite, Secure, HttpOnly, and session state.
- Host-only and domain cookies.
- Partitioned-cookie fields and Chrome cookie-store awareness.
- Immediate per-cookie and Clear all deletion with multi-level UNDO.
- Optional all-sites cookie permission required by Chrome for parent-domain cookies; the extension still queries only the active page URL.
- No analytics, tracking, remote code, or developer-side cookie storage.

## Load unpacked

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this repository directory.
5. Open an HTTP or HTTPS website and click the Cookie Leader toolbar icon.

If prompted, click **Allow cookie access**. Chrome requires the optional all-sites host permission before it exposes parent-domain cookies such as `.example.com` while visiting `www.example.com`. Cookie Leader still queries and displays only cookies matching the active page URL.

## Verify

```bash
node --check core.js
node --check popup.js
node --test tests/*.cjs
```

## Privacy

Cookie data is handled only inside the local Chrome profile. Cookie Leader does not collect, log, sync, transmit to Presemantic, or remotely process cookie names, values, visited URLs, or website content.

Project website: [www.presemantic.com](https://www.presemantic.com/)

See the [privacy policy](./PRIVACY.md) and [MIT license](./LICENSE).
