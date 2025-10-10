# Quick Start Guide

Get your BBFL website up and running in 5 minutes!

## Step 1: Clone and Install

```bash
cd bbfl-website
npm install
```

## Step 2: Update Configuration

Edit `astro.config.mjs` and replace `yourusername` with your GitHub username:

```js
site: 'https://yourusername.github.io',
```

## Step 3: Test Locally

```bash
npm run dev
```

Visit http://localhost:4321/bbfl-website/ in your browser.

## Step 4: Deploy to GitHub Pages

1. **Create a new repository** on GitHub named `bbfl-website`

2. **Initialize git and push:**

```bash
git init
git add .
git commit -m "Initial commit: BBFL website"
git branch -M main
git remote add origin https://github.com/yourusername/bbfl-website.git
git push -u origin main
```

3. **Enable GitHub Pages:**
   - Go to repository **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
   - The workflow will automatically deploy your site!

4. **View your site:**
   - https://yourusername.github.io/bbfl-website/

## Step 5: Add Your First Fighter

1. Create `data/fighters/new-fighter.json`:

```json
{
  "id": "new-fighter",
  "firstName": "First",
  "lastName": "Last",
  "nickname": "Nickname",
  "divisionId": "middle",
  "weight": 170,
  "height": "6'0\"",
  "reach": "72\"",
  "stance": "Orthodox",
  "nationality": "American",
  "age": 25,
  "bioFile": "new-fighter.md",
  "active": true,
  "debut": "2025-10-11"
}
```

2. Create `data/fighters/bios/new-fighter.md`:

```markdown
# First "Nickname" Last

Your fighter's bio goes here!

## Fighting Style
Describe their style...

## Background
Their story...
```

3. Commit and push:

```bash
git add data/fighters/
git commit -m "Add new fighter"
git push
```

The site will automatically rebuild and deploy!

## Step 6: Create Your First Event

1. Create `data/events/bbfl-002.json`:

```json
{
  "id": "bbfl-002",
  "slug": "bbfl-002-showdown",
  "title": "BBFL 002: Showdown",
  "date": "2025-10-25",
  "time": "21:00",
  "timezone": "America/New_York",
  "venueId": "saloon",
  "status": "upcoming",
  "description": "Epic fight night!",
  "bouts": []
}
```

2. Push to deploy:

```bash
git add data/events/
git commit -m "Add BBFL 002 event"
git push
```

## Common Tasks

### Update League Settings

Edit `data/settings.json` to change league name, tagline, purses, contact info, etc.

### Change Theme Colors

Edit `src/styles/global.css`:

```css
:root {
  --bourbon-red: #7B2E2E;    /* Primary color */
  --bourbon-dark: #4A1B1B;   /* Dark accent */
  --parchment: #F5F1E8;      /* Background */
  --charcoal: #2C2C2C;       /* Text color */
}
```

### View Rankings

Rankings update automatically on each build based on fight results!

## Troubleshooting

**Site not showing up?**
- Check GitHub Pages settings
- Ensure workflow is enabled
- Wait 2-3 minutes after push

**Build failing?**
- Check the Actions tab in GitHub
- Ensure all JSON files are valid
- Make sure fighter/event IDs match

**Need Help?**
- Check the full README.md
- Open an issue on GitHub

---

**You're ready to run your fight league! 🥊**
