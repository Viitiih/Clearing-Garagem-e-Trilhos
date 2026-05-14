# Arquitetura sugerida para produção

## Camada atual

O projeto atual é um front-end estático:

- `index.html`: estrutura da tela
- `styles.css`: identidade visual e responsividade
- `app.js`: regras de período, renderização, exportação CSV/Excel e ponto de integração futura
- `data/alvos.js`: dados locais de homologação

## Limitação do site estático

Netlify e GitHub Pages não acessam diretamente o Oracle corporativo. Por segurança e rede, a consulta real precisa ficar em um backend/API interno.

## Desenho recomendado

```text
Usuário
  ↓ navegador
Front-end estático
  ↓ HTTPS interno
API interna
  ↓ VPN/rede corporativa
Oracle Autopass / Oracle Garagens / Oracle Trilhos
```

## Endpoint sugerido

`POST /api/comparacao`

Payload:

```json
{
  "scope": "trilhos",
  "period": {
    "start": "2026-05-13T03:00:00",
    "end": "2026-05-14T02:59:59"
  }
}
```

Resposta:

```json
{
  "summary": [],
  "details": [],
  "generatedAt": "14/05/2026 10:09:27"
}
```

## Observação de segurança

Credenciais Oracle não devem ficar no front-end, no GitHub, no Netlify ou em arquivos JavaScript. Elas devem ficar somente no backend/API interno usando variáveis de ambiente ou cofre de segredos.
