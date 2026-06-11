# Google Reviews CSV Exporter for Chrome

A lightweight Chrome extension that helps export Google Maps reviews from the currently opened Google Maps business page into **CSV** or **JSON**.

This project is built as a simple, local-first tool for review management, reputation analysis, and internal reporting.

## Features

* Export Google Maps reviews to **CSV**
* Export Google Maps reviews to **JSON**
* Copy CSV output to clipboard
* Extract reviews currently loaded in the Google Maps reviews panel
* Optional auto-scroll to load more reviews before export
* Optional expansion of visible “More” / “Read more” review text
* Works locally in the browser
* No backend server
* No account login collection
* No proxy, captcha bypass, or hidden API usage

## Exported Fields

The extension currently exports the following fields:

| Field               | Description                                                |
| ------------------- | ---------------------------------------------------------- |
| `place_name`        | Business name from the Google Maps page                    |
| `place_url`         | Current Google Maps page URL                               |
| `review_id`         | Google review ID when available                            |
| `author_name`       | Review author name                                         |
| `author_link`       | Public Google Maps contributor profile link when available |
| `rating`            | Numeric rating                                             |
| `rating_label`      | Original rating label text                                 |
| `review_date`       | Review date text shown by Google Maps                      |
| `review_text`       | Review body                                                |
| `owner_answer`      | Business owner response when visible                       |
| `likes`             | Helpful / like count when visible                          |
| `review_image_urls` | Review image URLs when available                           |

## Installation

This extension is currently intended for local development / manual installation.

1. Download or clone this repository.
2. Open Chrome.
3. Go to:

```text
chrome://extensions
```

4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the extension folder.
7. Open a Google Maps business listing.
8. Open the reviews panel.
9. Click the extension icon.
10. Choose either:

* **Extract visible reviews**
* **Auto-scroll then extract**

## Usage

### Extract visible reviews

Use this when the reviews you need are already visible or loaded in the Google Maps reviews panel.

### Auto-scroll then extract

Use this when you want the extension to scroll through the reviews panel and attempt to load more reviews before exporting.

You can adjust:

* Scroll rounds
* Delay between scrolls
* Whether visible “More” review text should be expanded before extraction

After extraction, you can:

* Download CSV
* Download JSON
* Copy CSV to clipboard

## Permissions

The extension uses limited Chrome extension permissions:

```json
{
  "permissions": ["activeTab", "scripting"],
  "host_permissions": [
    "https://www.google.com/maps/*",
    "https://maps.google.com/*"
  ]
}
```

Additional Google Maps regional domains may be included depending on the package.

These permissions are used only to read the currently opened Google Maps business page and extract review information from the visible page content.

## Privacy

This extension runs locally in your browser.

It does **not**:

* Send review data to an external server
* Store data in a remote database
* Collect Google account credentials
* Track users
* Use analytics
* Use proxies
* Bypass captchas
* Call private Google APIs

Exported files are generated locally in your browser.

## Important Notes and Limitations

Google Maps changes its page structure frequently. Because this extension reads data from the visible Google Maps page, selectors may need maintenance over time.

Google Maps also uses dynamic loading and virtualized review lists. This means that not every review is always present in the page DOM at the same time. The auto-scroll feature attempts to load and capture more reviews, but complete extraction is not guaranteed for every business listing.

For best results:

* Open the business listing directly in Google Maps.
* Open the full reviews panel.
* Sort or filter reviews before running the extension if needed.
* Use auto-scroll with a reasonable delay.
* Keep the Google Maps tab active while extraction is running.

## Responsible Use

This project is intended for legitimate review management, research, and internal analysis use cases.

You are responsible for making sure your usage complies with:

* Google Maps / Google Business Profile terms
* Applicable privacy laws
* Data protection obligations
* Platform rules in your country or region

This project does not attempt to bypass technical restrictions, authentication, rate limits, captchas, or access controls.


## Development

Project structure:

```text
.
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
├── content.js
└── icons/
```

Main files:

* `manifest.json` — Chrome extension manifest
* `popup.html` — Extension popup UI
* `popup.css` — Popup styling
* `popup.js` — Popup logic, export buttons, CSV/JSON generation
* `content.js` — Google Maps page extraction logic

## Disclaimer

This project is not affiliated with, endorsed by, or sponsored by Google.

Google Maps and Google Business Profile are trademarks of Google LLC.
