# Portfolio of Janin A Apurba

Personal academic portfolio of **Janin A Apurba**: B.Sc. in CSE (AUST), Advanced ICT Officer at CNRS-UNHCR.

Live site: https://janin-a-apurba.vercel.app

© Janin A Apurba, CSE, AUST · Advanced ICT Officer, CNRS-UNHCR. All rights reserved.

## How to update your portfolio

All of the content lives in **one file: `data/profile.json`**. You never need to touch the HTML.

| To change… | Edit this part of `data/profile.json` |
|---|---|
| Name, role, email, phone, summary | the top fields (`name`, `currentRole`, `summary`, …) |
| Research or publications | `research`: add `"links": [{ "label": "PDF", "url": "…" }]` once a paper is published |
| Jobs and experience | `experience` |
| Projects | `projects` |
| Certificates | `certificates` (see below) |
| ORCID, Google Scholar, ResearchGate, Academia.edu, LinkedIn, Codeforces… | `profiles`: replace each default homepage link with your own profile URL |
| News on the home page | `news`: add the newest item at the top |

### Adding a new certificate
1. Save the certificate image as a JPG in `public/images/certificates/full/`, about 1100 px wide.
2. Save a smaller copy with the same name in `public/images/certificates/thumbs/`, about 520 px wide.
3. Add an entry to `certificates`:
   ```json
   { "title": "Course name", "issuer": "Coursera / University", "date": "2026-10-01", "id": "ABC123",
     "topic": "Machine Learning", "image": "cert-037.jpg", "url": "https://verify-link", "featured": false }
   ```
   `topic` becomes a filter button automatically. Leave `image` as `""` if you have no image.

### Publish
Double-click **`publish.cmd`**, or run it from a terminal with a message:
```
publish.cmd "Add ORCID link and new certificate"
```
It builds the site, commits the change and pushes it to GitHub. Vercel then redeploys automatically once the GitHub connection is set up. Until then, run `npx vercel deploy --prod` from this folder.

## Preview locally
```
node build.js
node serve.js 8090
```
Then open http://localhost:8090.

## Structure
- `data/profile.json`: all content
- `public/images/`: profile photo and certificate images
- `src/`: style.css, app.js and favicon.svg
- `build.js`: zero-dependency generator that writes `site/` (index.html, cv.html, 404, sitemap)
- `site/`: generated output; not committed, because Vercel builds it
