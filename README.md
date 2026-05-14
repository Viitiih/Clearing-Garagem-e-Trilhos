# Autopass | Painel de Validação de Binários

Site estático para homologação visual das automações:

- Autopass x Garagens
- Autopass x Trilhos

## O que esta versão faz

- Permite escolher período automático `03:00 até 02:59:59` ou período manual.
- Permite escolher uma consulta por execução: Garagens ou Trilhos.
- Carrega todos os alvos da consulta escolhida.
- Exibe resumo operacional em cards.
- Exibe tabela de resumo e tabela de divergências.
- Exporta CSV.
- Exporta Excel em modelo operacional com abas `RESUMO` e `DIVERGÊNCIAS`.

## Dados carregados

- **Garagens:** valores e binários vindos do Excel real enviado: `comparacao_autopass_garagens_20260514_100927.xlsx`.
- **Trilhos:** alvos reais extraídos da automação original. Como não foi enviado um Excel real de Trilhos e o Netlify/GitHub Pages não acessa o Oracle da empresa, os valores aparecem como **Aguardando API**. Nenhum valor de Trilhos foi inventado.

## Como publicar no Netlify

1. Suba todos os arquivos deste projeto para um repositório no GitHub.
2. No Netlify, escolha **Import from Git**.
3. Selecione o repositório.
4. Configure:
   - Build command: deixe vazio
   - Publish directory: `.`
5. Publique.

## Como publicar no GitHub Pages

Este projeto já inclui o workflow em `.github/workflows/pages.yml`.

1. Suba todos os arquivos para o GitHub.
2. Vá em **Settings > Pages**.
3. Em **Source**, selecione **GitHub Actions**.
4. Aguarde a Action finalizar.

## Próximo passo para produção

Para buscar dados reais em tempo real, este front precisa chamar uma API interna da empresa que execute as queries Oracle e retorne JSON neste formato:

```json
{
  "summary": [
    {
      "alvo": "METRO",
      "schemaBase": "METRO",
      "tpId": "1",
      "origem": 120,
      "autopass": 120,
      "originOnly": 0,
      "autopassOnly": 0,
      "status": "OK"
    }
  ],
  "details": []
}
```

O ponto de troca fica na função `executeQuery()` do arquivo `app.js`.
