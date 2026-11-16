# Rotina do Bebê (PWA)

App simples para anotar a rotina do bebê pelo celular e gerar PDF.
Sem servidor e sem banco externo: os dados ficam salvos no próprio aparelho (localStorage).

## Publicar
**Vercel:** arraste a pasta no vercel.com/new (ou `vercel --prod` dentro da pasta). Framework: *Other*, sem build.
**Cloudflare Pages:** Workers & Pages > Create > Pages > Upload assets, envie a pasta. Sem build.

## Instalar no celular
- iPhone (Safari): Compartilhar > Adicionar à Tela de Início.
- Android (Chrome): menu ⋮ > Instalar aplicativo.

## Observações
- Dados ficam por aparelho/navegador. Limpar dados do navegador apaga as fichas; gere os PDFs para guardar.
- Ao alterar arquivos, mude `V` em `sw.js` (ex.: rotina-bebe-v2) para os celulares atualizarem.
