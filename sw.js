const CACHE_NAME = 'enkai-v1';
const urlsToCache = [
  'index.html',
  'style.css',
  'script.js',
  'manifest.json'
  // guide.htmlやprofile.htmlはindex.htmlに統合されたため削除してもOKですが、
  // もし単体ファイルとしても残すならそのまま記載しておきます。
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then((response) => response || fetch(event.request)));
});