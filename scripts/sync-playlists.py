"""Refresh src/data/playlists.json from your public Spotify playlists.

Run: SPOTIFY_PLAYLIST_IDS=<id>,<id> python3 scripts/sync-playlists.py
A playlist id is the 22-character part of https://open.spotify.com/playlist/<id>.
Reads each playlist's public embed (titles, artists, official 30 s previews)
and each track's oEmbed (cover art). No API key; nothing is downloaded or
re-hosted: the site streams previews and artwork from Spotify's own CDN.
"""
import json
import os
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

# Your playlist ids, from the environment or edited in here.
PLAYLISTS = [p.strip() for p in os.environ.get('SPOTIFY_PLAYLIST_IDS', '').split(',') if p.strip()]
if not PLAYLISTS:
    raise SystemExit('Set SPOTIFY_PLAYLIST_IDS (comma-separated Spotify playlist ids); playlists.json left unchanged.')
HEADERS = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)'}
root = Path(__file__).resolve().parents[1]


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=30) as response:
        return response.read().decode('utf-8')


playlists, tracks = [], {}
for playlist_id in PLAYLISTS:
    html = get(f'https://open.spotify.com/embed/playlist/{playlist_id}')
    data = json.loads(re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.S).group(1))
    entity = data['props']['pageProps']['state']['data']['entity']
    playlists.append({'id': playlist_id, 'name': entity['name'], 'url': f'https://open.spotify.com/playlist/{playlist_id}'})
    for item in entity['trackList']:
        preview = (item.get('audioPreview') or {}).get('url')
        if not preview or not item.get('isPlayable', True):
            continue
        track_id = item['uri'].split(':')[-1]
        if track_id in tracks:
            tracks[track_id]['playlists'].append(playlist_id)
            continue
        tracks[track_id] = {
            'id': track_id,
            'title': item['title'],
            'artist': item['subtitle'].replace(' ', ' '),
            'playlists': [playlist_id],
            'url': f'https://open.spotify.com/track/{track_id}',
            'preview': preview,
            'durationMs': item.get('duration'),
        }

for track in tracks.values():
    oembed = json.loads(get('https://open.spotify.com/oembed?' + urllib.parse.urlencode({'url': track['url']})))
    track['artwork'] = oembed['thumbnail_url']
    time.sleep(0.4)

output = {'syncedAt': time.strftime('%Y-%m-%d'), 'playlists': playlists, 'tracks': list(tracks.values())}
(root / 'src/data/playlists.json').write_text(json.dumps(output, indent=2, ensure_ascii=False) + '\n')
print(f"{len(output['tracks'])} tracks from {len(playlists)} playlists")
