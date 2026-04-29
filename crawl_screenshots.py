#!/usr/bin/env python3
"""
Website screenshot crawler for atherenergy.com
- Crawls all internal pages except Investor Relations
- Takes full-page desktop screenshots (1440x900)
- Saves to ./output/ with URL-derived filenames
- Dismisses modal popups via ESC key
"""

import asyncio
import os
import re
from urllib.parse import urljoin, urlparse
from playwright.async_api import async_playwright

BASE_URL = "https://www.atherenergy.com"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
VIEWPORT = {"width": 1440, "height": 900}
SKIP_PATTERNS = [
    "investor",
    "investor-relations",
    "investors",
    "electric-scooter-price-in-",
    "locate-ather-dealer/",
    "electric-scooters-in-",
    "testride/book",
]


SKIP_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".pdf", ".zip", ".mp4", ".mp3", ".ico", ".woff", ".woff2", ".ttf", ".js", ".css"}


def is_internal(url: str) -> bool:
    parsed = urlparse(url)
    if not parsed.netloc in ("", "www.atherenergy.com", "atherenergy.com"):
        return False
    ext = os.path.splitext(parsed.path)[1].lower()
    if ext in SKIP_EXTENSIONS:
        return False
    return True


def is_excluded(url: str) -> bool:
    path = urlparse(url).path.lower()
    return any(pat in path for pat in SKIP_PATTERNS)


def url_to_filename(url: str) -> str:
    parsed = urlparse(url)
    path = parsed.path.strip("/")
    if not path:
        return "home"
    # Replace slashes and special chars with underscores
    name = re.sub(r"[^a-zA-Z0-9_-]", "_", path)
    name = re.sub(r"_+", "_", name).strip("_")
    return name or "home"


async def dismiss_modals(page):
    """Press ESC and close common modal patterns."""
    try:
        await page.keyboard.press("Escape")
        await asyncio.sleep(0.3)
    except Exception:
        pass

    # Also try clicking common close buttons
    close_selectors = [
        "button[aria-label*='close' i]",
        "button[aria-label*='dismiss' i]",
        ".modal-close",
        ".close-button",
        "[data-dismiss='modal']",
        ".cookie-close",
        ".popup-close",
    ]
    for sel in close_selectors:
        try:
            btn = page.locator(sel).first
            if await btn.is_visible():
                await btn.click()
                await asyncio.sleep(0.3)
        except Exception:
            pass


async def collect_links(page, visited: set) -> set:
    """Collect all internal links on the current page."""
    hrefs = await page.eval_on_selector_all("a[href]", "els => els.map(e => e.href)")
    links = set()
    for href in hrefs:
        href = href.split("#")[0].split("?")[0].rstrip("/")
        if not href:
            continue
        if is_internal(href) and not is_excluded(href) and href not in visited:
            # Normalise to include trailing content
            if urlparse(href).scheme in ("http", "https"):
                links.add(href)
    return links


async def screenshot_page(page, url: str, output_dir: str):
    filename = url_to_filename(url) + ".png"
    filepath = os.path.join(output_dir, filename)

    print(f"  -> {url}")
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        # Extra wait for JS-heavy pages
        try:
            await page.wait_for_load_state("networkidle", timeout=8000)
        except Exception:
            pass
    except Exception as e:
        print(f"     [WARN] Navigation timeout/error: {e} — trying anyway")

    # Wait a moment for any animations / lazy loads
    await asyncio.sleep(1.5)

    # Dismiss any popups/modals
    await dismiss_modals(page)
    await asyncio.sleep(0.5)

    # Full-page screenshot
    await page.screenshot(path=filepath, full_page=True)
    print(f"     Saved: {filename}")
    return filepath


async def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport=VIEWPORT,
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            locale="en-US",
            ignore_https_errors=True,
        )
        page = await context.new_page()

        visited: set[str] = set()
        queue: list[str] = [BASE_URL]

        print(f"Starting crawl of {BASE_URL}")
        print(f"Screenshots will be saved to: {OUTPUT_DIR}\n")

        while queue:
            url = queue.pop(0)
            # Normalise URL
            url = url.rstrip("/") if url != BASE_URL else url
            if url in visited:
                continue
            if is_excluded(url):
                print(f"  [SKIP investor-relations] {url}")
                continue

            visited.add(url)
            print(f"[{len(visited)}] Processing: {url}")

            try:
                await screenshot_page(page, url, OUTPUT_DIR)
            except Exception as e:
                print(f"     [ERROR] {e}")
                continue

            # Collect new links from this page
            new_links = await collect_links(page, visited)
            for link in sorted(new_links):
                if link not in visited and link not in queue:
                    queue.append(link)

        await browser.close()

    screenshots = [f for f in os.listdir(OUTPUT_DIR) if f.endswith(".png")]
    print(f"\nDone. {len(screenshots)} screenshots saved to ./{os.path.basename(OUTPUT_DIR)}/")
    for s in sorted(screenshots):
        print(f"  {s}")


if __name__ == "__main__":
    asyncio.run(main())
