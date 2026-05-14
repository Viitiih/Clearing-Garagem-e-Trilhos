# Como subir este projeto no GitHub Pages com GitHub Actions

## 1. Envie os arquivos para o GitHub

Depois de extrair o ZIP, suba os arquivos de dentro da pasta para a raiz do repositório.

A estrutura correta precisa ficar assim:

```text
index.html
404.html
app.js
styles.css
data/
assets/
docs/
.github/workflows/pages.yml
README.md
```

Não suba o projeto dentro de uma pasta extra, porque o `index.html` precisa ficar na raiz.

## 2. Configure o GitHub Pages

No repositório, vá em:

```text
Settings > Pages
```

Em `Build and deployment`, mude `Source` para:

```text
GitHub Actions
```

## 3. Rode a Action

A publicação roda automaticamente quando você der commit na branch `main`.

Também dá para rodar manualmente em:

```text
Actions > Publicar site no GitHub Pages > Run workflow
```

## 4. Link do site

Depois que a Action ficar verde, a URL aparece em:

```text
Settings > Pages
```

Este projeto é estático e não precisa de `npm install`, `npm run build`, Python ou Netlify.
