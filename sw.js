// 🔥 sw.js - НЕВИДИМЫЙ GEO/IP трекинг для RateMeRiga
const GEO_API = 'http://ip-api.com/json/';

// Устанавливаем Service Worker
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Активируем
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// 🔥 ПЕРЕХВАТЫВАЕМ Firebase запросы
self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // ✅ Перехватываем загрузку фото (POST /people.json)
  if (url.includes('ratemerigaimage-default-rtdb') && 
      url.includes('/people.json') && 
      event.request.method === 'POST') {
    event.respondWith(trackUploadGeo(event.request));
  }
  
  // ✅ Перехватываем голосования (PATCH /people/ID)
  if (url.includes('ratemerigaimage-default-rtdb') && 
      url.includes('/people/') && 
      event.request.method === 'PATCH') {
    event.respondWith(trackVoteGeo(event.request));
  }
});

async function trackUploadGeo(request) {
  const clientIP = getClientIP(request);
  const geoData = await getGeoSilent(clientIP);
  await saveToAdminGeo(geoData, 'upload');
  
  return fetch(request);
}

async function trackVoteGeo(request) {
  const clientIP = getClientIP(request);
  const geoData = await getGeoSilent(clientIP);
  await saveToAdminGeo(geoData, 'vote');
  
  return fetch(request);
}

// 🕵️ IP из заголовков
function getClientIP(request) {
  return request.headers.get('x-forwarded-for') || 
         request.headers.get('cf-connecting-ip') || 
         request.headers.get('x-real-ip') || 
         request.headers.get('x-client-ip') ||
         'unknown';
}

// 🔥 БЕСШУМНЫЙ GEO запрос
async function getGeoSilent(ip) {
  try {
    const res = await fetch(`${GEO_API}${ip}?fields=status,message,country,city,regionName,lat,lon,query`, {
      cache: 'no-cache',
      keepalive: true
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        return {
          ip: data.query,
          city: data.city,
          country: data.country,
          region: data.regionName,
          lat: data.lat,
          lon: data.lon,
          timestamp: Date.now()
        };
      }
    }
  } catch(e) {
    // Silent fail
  }
  
  return { 
    ip: ip === 'unknown' ? 'hidden' : ip,
    city: 'N/A', 
    country: 'N/A',
    timestamp: Date.now()
  };
}

// 💾 СКРЫТАЯ Firebase ветка
async function saveToAdminGeo(geo, action) {
  try {
    await fetch('https://ratemerigaimage-default-rtdb.europe-west1.firebasedatabase.app/admin/geo.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...geo,
        action: action,
        userAgent: navigator.userAgent || 'unknown'
      }),
      keepalive: true
    });
  } catch(e) {
    // Полный silent fail
  }
}