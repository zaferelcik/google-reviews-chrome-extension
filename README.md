# Google Reviews CSV Exporter for Chrome

A Manifest V3 Chrome extension that exports currently loaded Google Maps reviews to CSV or JSON.

## What it does

- Reads reviews that are visible or loaded inside the current Google Maps reviews panel.
- Optional auto-scroll loads more review cards before extraction.
- Optional expansion of visible “More” review text.
- Exports CSV that opens in Excel/Google Sheets.
- Exports JSON for analysis pipelines.

## Data fields

- place_name
- place_url
- review_id
- author_name
- author_link
- rating
- rating_label
- review_date
- review_text
- owner_answer
- likes
- review_image_urls

## Install locally

1. Unzip this folder.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select this folder.
6. Open Google Maps, open a business listing, open the reviews panel, then click the extension icon.

## Notes

Google Maps changes its DOM often, so selectors may need maintenance. This extension intentionally avoids credential capture, bypassing, proxies, captcha avoidance, or hidden API calls. Use it only where you have the right to process the review data and respect Google’s terms and privacy obligations.
