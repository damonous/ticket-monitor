#!/usr/bin/env python3
"""Record the ticket monitor status page as a video."""
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT_DIR = Path(__file__).parent
URL = "https://freelance.mvp.dev/ticket-monitor/"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 1280, "height": 720},
        record_video_dir=str(OUT_DIR),
        record_video_size={"width": 1280, "height": 720},
    )
    page = context.new_page()
    page.goto(URL, wait_until="networkidle")
    print("loaded", flush=True)

    # Phase 1: dwell on top of page (intro / lede)
    time.sleep(8)

    # Phase 2: now monitoring section
    page.evaluate("window.scrollTo({ top: 0, behavior: 'smooth' })")
    time.sleep(2)

    # Phase 3: smooth scroll to recent alerts area
    for y in range(0, 600, 30):
        page.evaluate(f"window.scrollTo(0, {y})")
        time.sleep(0.15)
    time.sleep(15)

    # Phase 4: scroll back to top to highlight monitoring card again
    page.evaluate("window.scrollTo({ top: 0, behavior: 'smooth' })")
    time.sleep(8)

    # Phase 5: scroll down again to show alert log + footer
    for y in range(0, 900, 25):
        page.evaluate(f"window.scrollTo(0, {y})")
        time.sleep(0.18)
    time.sleep(20)

    # Phase 6: dwell on footer (Discord webhook note + source)
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    time.sleep(15)

    # Phase 7: scroll back up slowly for the final shot
    for y in range(900, 0, -25):
        page.evaluate(f"window.scrollTo(0, {y})")
        time.sleep(0.15)
    time.sleep(10)

    # Phase 8: open GitHub repo URL in a second tab to reference it on screen
    gh = context.new_page()
    gh.goto("https://github.com/damonous/ticket-monitor", wait_until="domcontentloaded")
    time.sleep(15)
    gh.close()
    time.sleep(2)

    # Phase 9: final pause back on status page
    time.sleep(15)

    print("recording done", flush=True)
    page.close()
    video_path = page.video.path() if page.video else None
    context.close()
    browser.close()

# Find latest webm and rename
webms = sorted(OUT_DIR.glob("*.webm"), key=lambda p: p.stat().st_mtime)
if webms:
    latest = webms[-1]
    target = OUT_DIR / "screen.webm"
    if target != latest:
        if target.exists():
            target.unlink()
        latest.rename(target)
    print(f"video: {target} ({target.stat().st_size} bytes)", flush=True)
