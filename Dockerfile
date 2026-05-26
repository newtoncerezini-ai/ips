# --- Estágio 1: Build da Aplicação ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copia os arquivos de definição de pacotes primeiro para aproveitar o cache do Docker
COPY package*.json ./

# Instala todas as dependências (incluindo as de desenvolvimento para rodar o 'vite build')
RUN npm ci

# Copia todo o restante do código-fonte do repositório
COPY . .

# Executa o build do Vite (gerará os arquivos prontos na pasta /dist)
RUN npm run build

# --- Estágio 2: Servidor de Execução Ultra-Leve ---
FROM node:18-alpine

WORKDIR /app

# Copia apenas os arquivos estáticos compilados e o script do servidor
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts/serve-dist.mjs ./scripts/serve-dist.mjs
COPY --from=builder /app/package*.json ./

# Instala apenas dependências necessárias para a produção (se houver)
RUN npm ci --only=production

# Configura a porta padrão (3838) exigida pelo ShinyProxy
ENV PORT=3838
EXPOSE 3838

# Comando para iniciar o servidor customizado que adaptamos para subpastas
CMD ["node", "scripts/serve-dist.mjs"]


############ Comandos #############
# docker helper
# 1. Faz o build da imagem
# docker build -t hugoavmedeiros/ips:latest .
# 2. Remove o contêiner de teste caso ele já esteja rodando
# docker rm -f teste_ips
# 3. Roda o contêiner interativamente com auto-remoção (--rm) na porta do ShinyProxy
# docker run --rm -it -p 3838:3838 --name teste_ips hugoavmedeiros/ips:latest
# 4. Links para testar no navegador (pode clicar quando rodar o comando acima):
# http://localhost:3838/
# 5. Envia a imagem para o Docker Hub
# docker push hugoavmedeiros/ips:latest
# 6. Puxa a imagem atualizada
# docker pull hugoavmedeiros/ips:latest
# 7. Limpeza agressiva: derruba e remove qualquer contêiner baseado nessa imagem
# docker ps -q -f "ancestor=hugoavmedeiros/ips:latest" | xargs -r docker rm -f