# MP4 → MP3 PWA

This project adds a minimal Progressive Web App that accepts MP4 files shared from the Files by Google Android app and converts them to MP3 using ffmpeg.wasm in the browser.

Files added:
- index.html
- manifest.json
- sw.js
- idb.js
- main.js
- icons/icon-192.png (placeholder)
- icons/icon-512.png (placeholder)

How to test locally:
1. Serve the repository over HTTPS (or use a tunnel like ngrok).
2. Open the site in Chrome on Android and install the PWA (Add to Home screen).
3. In Files by Google, select an MP4 → Share → pick the installed PWA.
4. Convert and download the MP3.

Notes:
- Large files may be slow or run out of memory in the browser; for heavy usage consider a server-side approach.
- Replace icons in /icons/ with your own artwork.
