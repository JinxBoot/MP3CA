// main entry: register service worker, check for shared file, run ffmpeg.wasm to convert
import { createFFmpeg, fetchFile } from 'https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js';

const ffmpeg = createFFmpeg({ log: true });

const fileInput = document.getElementById('fileInput');
const convertBtn = document.getElementById('convertBtn');
const downloadLink = document.getElementById('downloadLink');
const status = document.getElementById('status');
const logEl = document.getElementById('log');

function log(...args) { logEl.textContent += args.join(' ') + '\n'; logEl.scrollTop = logEl.scrollHeight; }

async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
      log('Service worker registered');
    } catch (e) {
      log('SW register failed:', e);
    }
  }
}

function enableConvertIfFile(file) {
  if (!file) { convertBtn.disabled = true; return; }
  convertBtn.disabled = false;
  convertBtn.onclick = () => convertFile(file);
  downloadLink.classList.add('hidden');
}

fileInput.addEventListener('change', () => {
  const f = fileInput.files[0];
  enableConvertIfFile(f);
});

async function checkSharedFile() {
  // If we were opened via share-target, there's a stored file in IndexedDB
  try {
    const shared = await window.idbGet('shared-file');
    if (shared && shared.blob) {
      const file = new File([shared.blob], shared.name, { type: shared.blob.type });
      status.textContent = `Received shared file: ${file.name}`;
      enableConvertIfFile(file);
      // remove stored copy
      await window.idbDelete('shared-file');
    } else {
      log('No shared file found in storage.');
    }
  } catch (e) {
    log('Error reading shared file:', e);
  }
}

async function convertFile(file) {
  status.textContent = 'Loading ffmpeg...';
  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
    log('ffmpeg loaded');
  }
  const inName = 'input' + Date.now() + '.mp4';
  const outName = 'output' + Date.now() + '.mp3';

  log('Writing file to FS:', inName);
  ffmpeg.FS('writeFile', inName, await fetchFile(file));

  status.textContent = 'Converting... (this may take a while)';
  try {
    // extract audio: -vn removes video, set bitrate & sample rate
    await ffmpeg.run('-i', inName, '-vn', '-ar', '44100', '-ac', '2', '-b:a', '192k', outName);
    log('Conversion finished');
    const data = ffmpeg.FS('readFile', outName);
    const blob = new Blob([data.buffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = (file.name.replace(/\.[^/.]+$/, '') || 'audio') + '.mp3';
    downloadLink.textContent = 'Download MP3';
    downloadLink.classList.remove('hidden');
    status.textContent = 'Conversion complete';
    // optionally present a share via Web Share API if available
    downloadLink.onclick = (e) => {
      // let browser handle download; also offer navigator.share if supported
    };
    if (navigator.canShare && navigator.canShare({ files: [new File([blob], downloadLink.download, { type: blob.type })] })) {
      const shareBtn = document.createElement('button');
      shareBtn.textContent = 'Share MP3';
      shareBtn.onclick = async () => {
        try {
          await navigator.share({ files: [new File([blob], downloadLink.download, { type: blob.type })], title: 'Converted MP3' });
        } catch (err) {
          log('Share failed', err);
        }
      };
      downloadLink.after(shareBtn);
    }
  } catch (err) {
    log('Error during conversion:', err);
    status.textContent = 'Conversion failed: see log';
  } finally {
    // clean up input file in FS
    try { ffmpeg.FS('unlink', inName); } catch {}
  }
}

(async function init() {
  await registerSW();
  // If the share sent us here with a query param, pick up the file
  await checkSharedFile();
  // also allow direct selection
  if (!convertBtn.onclick) convertBtn.disabled = true;
})();
