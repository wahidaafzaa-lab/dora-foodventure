const CACHE="dora-foodventure-3d-v2";
const ASSETS=["./content.json", "./index.html", "./app.js", "./manifest.json", "./style.css", "./assets/decor/decor-sheet.png", "./assets/characters/dora-main.png", "./assets/characters/map-main.png", "./assets/characters/backpack-main.png", "./assets/backgrounds/home-bg.png", "./assets/foods/banana.png", "./assets/foods/apple.png", "./assets/foods/milk.png", "./assets/foods/water.png", "./assets/foods/carrot.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
