/*
 * Service worker do SOMA: permite estudar sem internet.
 *
 * Estratégia (simples de propósito):
 * - Páginas e dados de navegação: tenta a rede primeiro; sem internet,
 *   usa a última cópia salva. Assim o estudante nunca fica preso a uma
 *   versão antiga quando está online.
 * - Arquivos estáticos com nome versionado (/_next/static, fontes, ícones):
 *   usa a cópia salva, porque eles nunca mudam de conteúdo.
 * - Página nunca visitada e sem internet: mostra um aviso simples.
 *
 * Ao mudar este arquivo de forma incompatível, troque a VERSÃO para
 * descartar as cópias antigas.
 */
const VERSION = "soma-v1";
const PAGES = `${VERSION}-paginas`;
const STATIC = `${VERSION}-estaticos`;

// Telas principais, salvas logo na instalação.
const PRECACHE = ["/", "/estudar", "/erros", "/progresso", "/cartoes", "/desafio", "/tecnicas", "/simulado"];

const OFFLINE_HTML = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Sem internet · SOMA</title>
<style>body{margin:0;font-family:system-ui,sans-serif;background:#f4f5f0;color:#15181f;display:grid;place-items:center;min-height:100vh;padding:24px;box-sizing:border-box}
main{max-width:28rem}h1{font-size:1.6rem}a{color:#3b36d1;font-weight:700}
@media (prefers-color-scheme:dark){body{background:#111318;color:#ecedef}a{color:#8b87f5}}</style></head>
<body><main><h1>Você está sem internet</h1><p>Esta página ainda não foi aberta neste aparelho, então não há uma cópia salva.
As telas que você já visitou continuam funcionando, e seu progresso está salvo.</p><p><a href="/">Voltar ao início</a></p></main></body></html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => undefined) // sem internet na instalação: segue sem as cópias
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:woff2?|png|svg|ico)$/.test(url.pathname)
  );
}

async function networkFirst(request) {
  const cache = await caches.open(PAGES);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      return new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(isStaticAsset(url) ? cacheFirst(request) : networkFirst(request));
});
