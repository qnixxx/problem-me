# problem.me — GitHub Pages deployment

Static pre-launch homepage for **problem.me**. No framework, build step, database, analytics, cookies, package manager, or external JavaScript is required.

## Repository files

```text
problem-me/
├── index.html     # The website
├── .nojekyll      # Tells GitHub Pages to serve files as plain static content
└── README.md      # Project/deployment notes (not required by the website)
```

`index.html` is the only file the website actually needs. `.nojekyll` is included to bypass Jekyll processing. `README.md` is documentation for the repository.

## 1. Test locally

You can double-click `index.html`, or from this folder run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

Check:
- boot sequence appears
- SKIP BOOT works
- capybara blinks (unless Reduce Motion is enabled on your device)
- capybara status text changes
- `solve everything` easter egg works
- navigation links scroll to the correct sections
- mobile layout looks acceptable

## 2. Create the GitHub repository

1. Sign in to GitHub.
2. Click **New repository**.
3. Suggested repository name: `problem-me`.
4. Set visibility to **Public** if using GitHub Free for Pages.
5. Do not initialize it with a README if you plan to upload this package directly (either choice is fine; this simply avoids a merge/overwrite step).
6. Create the repository.

## 3. Upload the site

In the new repository:

1. Choose **Add file → Upload files**.
2. Upload `index.html`, `.nojekyll`, and `README.md` into the repository root — not inside another folder.
3. Commit directly to the `main` branch.

The root should look like:

```text
/problem-me
  index.html
  .nojekyll
  README.md
```

## 4. Turn on GitHub Pages

1. Open the repository's **Settings**.
2. In the sidebar choose **Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose branch **main**.
5. Choose folder **/ (root)**.
6. Click **Save**.

For a repository called `problem-me`, the temporary GitHub URL will normally be:

```text
https://YOUR-GITHUB-USERNAME.github.io/problem-me/
```

GitHub will show the exact live URL in **Settings → Pages** after deployment.

## 5. Update the site later

There is no deployment command. Edit `index.html`, commit the change to `main`, and GitHub Pages deploys the new version automatically.

For simple edits in the browser:

1. Open `index.html` on GitHub.
2. Click the pencil/edit button.
3. Make the change.
4. Click **Commit changes**.

## 6. Optional: use problem.me later

Do this only after you own/control the domain.

Recommended order:

1. Verify the domain in your GitHub account's Pages/domain settings.
2. In the repository go to **Settings → Pages → Custom domain** and enter `problem.me`.
3. Configure the domain's DNS at your registrar/DNS provider.
4. For the apex domain (`problem.me`), GitHub currently documents these A records:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
5. Optionally configure `www.problem.me` as a CNAME pointing to `YOUR-GITHUB-USERNAME.github.io`.
6. Wait for GitHub's DNS check and certificate provisioning.
7. Enable **Enforce HTTPS** in **Settings → Pages** when available.

When publishing from a branch, GitHub's custom-domain setting may create/update a `CNAME` file in the publishing source. Keep that file if it appears.

Avoid wildcard DNS records such as `*.problem.me` for this setup.

## 7. Cost

For this version of the site:

- GitHub repository: free
- GitHub Pages hosting: free for a public repository on GitHub Free
- SSL/HTTPS from GitHub Pages: free
- Build tools/server/database: none
- Custom domain: domain registration/renewal is the only expected external cost if you use `problem.me`

## Important note

The placeholder email `hello@problem.me` is currently shown on the page. Replace or remove it before launch if you do not control that mailbox/domain.
