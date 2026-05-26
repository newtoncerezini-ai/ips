import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "dist");
// Para o ShinyProxy, utilizaremos a porta 3838 como padrão se nenhuma for passada
const port = Number(process.env.PORT ?? 3838);

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function fileFor(url) {
  const pathname = decodeURIComponent(new URL(url, `http://localhost:${port}`).pathname);
  const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  
  // 1. Tenta o caminho exato (funciona localmente ou se mapeado direto)
  let candidate = join(root, safe);
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  
  // 2. CORREÇÃO PARA SHINYPROXY: 
  // Se a URL contiver caminhos extras (ex: /app_direct/ips/assets/main.js),
  // vamos fatiar o caminho para tentar achar o arquivo real dentro de 'dist/'
  const parts = safe.split(/[/\\]/).filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    const subPath = join(root, ...parts.slice(i));
    if (existsSync(subPath) && statSync(subPath).isFile()) {
      return subPath;
    }
  }

  // Se for a rota raiz do app ou uma rota interna do React, serve o index.html
  return join(root, "index.html");
}

createServer((req, res) => {
  const file = fileFor(req.url ?? "/");
  res.setHeader("Content-Type", types[extname(file)] ?? "application/octet-stream");
  createReadStream(file)
    .on("error", () => {
      res.statusCode = 404;
      res.end("Not found");
    })
    .pipe(res);
}).listen(port, "0.0.0.0", () => {
  console.log(`Serving ${root} at http://localhost:${port}`);
});