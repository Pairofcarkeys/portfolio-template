"""Screenshot every live design-work site into public/design-work/<id>.jpg.

Run: python3 scripts/capture-design-work.py [id ...]
The 1440x900 frames are the loading poster in the /work browser, the image on
the 3D laptop screen, and the fallback when WebGL or iframes are unavailable.
"""
import base64
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
sites = json.loads((root / 'src/data/design-work.json').read_text())['sites']
only = set(sys.argv[1:])
output = root / 'public/design-work'
output.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 900})
    for site in sites:
        if only and site['id'] not in only:
            continue
        page.goto(site['url'], wait_until='networkidle', timeout=60_000)
        # Most of these sites open with an intro move; capture the settled frame.
        page.wait_for_timeout(5_000)
        page.screenshot(path=str(output / f"{site['id']}.jpg"), type='jpeg', quality=82)
        # Safari's tab favicon: the site's own icon, rasterised to 64px PNG.
        icon = page.evaluate("""() => {
          const link = [...document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')].pop();
          return new URL(link ? link.href : '/favicon.ico', location.href).href;
        }""")
        response = page.request.get(icon)
        icon_page = browser.new_page(viewport={'width': 64, 'height': 64})
        if response.ok:
            body = response.body()
            kind = response.headers.get('content-type', 'image/png').split(';')[0]
            icon_page.set_content(f'<body style="margin:0;background:transparent"><img style="width:64px;height:64px;object-fit:contain" src="data:{kind};base64,{base64.b64encode(body).decode()}">')
        else:
            letter = site['title'][0].upper()
            icon_page.set_content(f'<body style="margin:0"><div style="width:64px;height:64px;display:grid;place-items:center;background:#1d1d1f;color:#fff;font:600 36px -apple-system,sans-serif">{letter}</div>')
        icon_page.wait_for_timeout(200)
        icon_page.screenshot(path=str(output / f"{site['id']}-icon.png"), omit_background=True)
        icon_page.close()
        print(site['id'])
    browser.close()
