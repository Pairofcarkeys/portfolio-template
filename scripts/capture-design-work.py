"""Screenshot every live design-work site into public/design-work/<id>.jpg.

Run: python3 scripts/capture-design-work.py [--phone] [id ...]
The 1440x900 frames are the loading poster in the /work browser, the image on
the 3D laptop screen, and the fallback when WebGL or iframes are unavailable.
--phone instead saves <id>-phone.jpg: the site's mobile layout at the iPhone 15
Pro Max's 430-point width, cropped to the page area below iOS Safari's status
bar (STATUS_BAR in src/components/IosSafari.tsx). It also records each
page's top and bottom edge colour, which Safari bleeds into the status bar and
behind the home indicator, in src/data/design-work-phone.json.
"""
import base64
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
sites = json.loads((root / 'src/data/design-work.json').read_text())['sites']
phone = '--phone' in sys.argv
only = {arg for arg in sys.argv[1:] if not arg.startswith('--')}
# The 430x929-point display minus IosSafari's 54-point STATUS_BAR.
PHONE_VIEWPORT = {'width': 430, 'height': 875}
IPHONE_UA = ('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 '
             '(KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1')
output = root / 'public/design-work'
output.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    if phone:
        from PIL import Image
        tints_path = root / 'src/data/design-work-phone.json'
        tints = json.loads(tints_path.read_text()) if tints_path.exists() else {}

        def edge(image, y):
            row = image.crop((0, y, image.width, y + 4)).resize((1, 1), Image.Resampling.BOX).getpixel((0, 0))
            return '#%02x%02x%02x' % row[:3]

        context = browser.new_context(viewport=PHONE_VIEWPORT, device_scale_factor=2, is_mobile=True, has_touch=True, user_agent=IPHONE_UA)
        for site in sites:
            if only and site['id'] not in only:
                continue
            page = context.new_page()
            page.goto(site['url'], wait_until='networkidle', timeout=60_000)
            page.wait_for_timeout(5_000)
            shot = output / f"{site['id']}-phone.jpg"
            page.screenshot(path=str(shot), type='jpeg', quality=78)
            page.close()
            with Image.open(shot) as image:
                tints[site['id']] = {'top': edge(image.convert('RGB'), 0), 'bottom': edge(image.convert('RGB'), image.height - 4)}
            print(site['id'], 'phone')
        tints_path.write_text(json.dumps(dict(sorted(tints.items())), indent=2) + '\n')
        browser.close()
        sys.exit()
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
