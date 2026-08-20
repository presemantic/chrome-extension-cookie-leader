# Privacy Policy for HTTP Cookies Editor

Effective date: August 20, 2026

HTTP Cookies Editor is a local Chrome extension published by Presemantic. Its single purpose is to let a user view, create, edit, delete, clear, and restore HTTP cookies that match the URL of the active browser tab.

## Data handling

The extension processes cookie names, values, domains, paths, expiration settings, security attributes, partition keys, the active tab URL, and the active Chrome cookie-store identifier only inside the user's local Chrome profile. This information is used solely to provide the cookie-editor interface and the action explicitly selected by the user.

HTTP Cookies Editor does not collect, log, transmit, sell, share, synchronize, or remotely process cookie data, browsing history, website content, personal information, authentication information, or analytics. It does not use remote code and does not send data to Presemantic or any third party.

## Permissions

The extension uses Chrome's `cookies` permission to read and modify cookies. It uses `activeTab` to identify the current page and keep the displayed cookie list scoped to that page. Chrome requires optional HTTP(S) host access before its cookie API exposes parent-domain cookies, such as a `.example.com` cookie while the user visits `www.example.com`. Even after that permission is granted, the extension queries cookies using the exact active-tab URL and displays only matching cookies.

## Retention and deletion

The extension does not maintain a remote database or developer-accessible copy of any user data. Its deletion history exists only in memory while the popup remains open and is discarded when the popup closes. Cookie changes are applied directly to the local Chrome cookie store at the user's request.

## Contact

Questions or privacy requests can be submitted through the public project repository at [github.com/presemantic/chrome-extension-cookie-leader](https://github.com/presemantic/chrome-extension-cookie-leader) or through [www.presemantic.com](https://www.presemantic.com/).

## Changes

Material changes to this policy will be published in the project repository with an updated effective date.
