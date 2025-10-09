# Deployment Checklist

## Pre-Deployment Configuration

- [ ] Update `astro.config.mjs` with your GitHub username
  ```js
  site: 'https://YOUR_USERNAME.github.io',
  base: '/bbfl-website',
  ```

- [ ] Update `data/settings.json` with your league information
  - League name and tagline
  - Discord invite link
  - Contact email

- [ ] Verify all sample data is appropriate or replace with your own
  - Fighters in `data/fighters/`
  - Events in `data/events/`
  - Venues in `data/venues.json`
  - Sponsors in `data/sponsors.json`

## GitHub Setup

- [ ] Create a new repository on GitHub named `bbfl-website`
  - Can be public or private
  - Do NOT initialize with README (already exists)

- [ ] Initialize and push to GitHub:
  ```bash
  git init
  git add .
  git commit -m "Initial commit: Blood & Bourbon Fight League website"
  git branch -M main
  git remote add origin https://github.com/YOUR_USERNAME/bbfl-website.git
  git push -u origin main
  ```

## Enable GitHub Pages

- [ ] Go to repository Settings → Pages
- [ ] Under "Build and deployment" → Source
- [ ] Select **GitHub Actions** (not "Deploy from a branch")
- [ ] Wait for the workflow to complete (check Actions tab)
- [ ] Visit `https://YOUR_USERNAME.github.io/bbfl-website/`

## Verify Deployment

- [ ] Homepage loads with league name and tagline
- [ ] Countdown timer shows next event date
- [ ] All navigation links work
- [ ] Fighter profiles display correctly
- [ ] Rankings page shows computed rankings
- [ ] Events page lists sample event
- [ ] Rules page displays league rules
- [ ] Mobile responsive design works

## Post-Deployment

- [ ] Share your site URL with your community
- [ ] Add site URL to your Discord server
- [ ] Create your first custom fighter
- [ ] Schedule your first event
- [ ] Test the workflow by making a change and pushing

## Maintenance Workflow

### Adding Content

1. Edit JSON files in `/data` directory
2. Commit changes: `git commit -am "Add new content"`
3. Push to GitHub: `git push`
4. GitHub Actions automatically rebuilds and deploys
5. Changes live in 2-3 minutes

### Common Updates

**Add a Fighter:**
```bash
# Create files
vim data/fighters/new-fighter.json
vim data/fighters/bios/new-fighter.md

# Commit and deploy
git add data/fighters/
git commit -m "Add new fighter: Name"
git push
```

**Add an Event:**
```bash
# Create event file
vim data/events/bbfl-002.json

# Commit and deploy
git add data/events/
git commit -m "Add BBFL 002 event"
git push
```

**Record Fight Results:**
```bash
# Create result file
vim data/results/result-004.json

# Commit and deploy (rankings update automatically!)
git add data/results/
git commit -m "Add BBFL 002 results"
git push
```

## Troubleshooting

### Build Fails
- Check Actions tab for error logs
- Validate all JSON syntax
- Ensure fighter/bout/event IDs match

### Site Not Updating
- Verify push completed
- Check Actions tab for workflow status
- Clear browser cache
- Wait 2-3 minutes for CDN propagation

### Rankings Not Computing
- Ensure result files reference valid bout IDs
- Check that bout files reference valid fighter IDs
- Review build logs for computation errors

### 404 Errors on Subpages
- Verify `base` is set correctly in `astro.config.mjs`
- Should match repository name: `/bbfl-website/`

## Custom Domain (Optional)

To use a custom domain like `bbfl.com`:

1. Add a `CNAME` file to `/public`:
   ```
   bbfl.com
   ```

2. Update `astro.config.mjs`:
   ```js
   site: 'https://bbfl.com',
   base: '/',
   ```

3. Configure DNS at your domain registrar:
   - Add CNAME record pointing to `YOUR_USERNAME.github.io`

4. Enable custom domain in GitHub Pages settings

## Performance Tips

- Images: Optimize and compress before adding to `/public/images`
- Keep individual JSON files small (under 100KB)
- Use efficient fighter photo formats (WebP recommended)
- Minimize custom CSS additions

## Security

- Never commit `.env` files with secrets
- Don't expose personal contact information in public data files
- Review all user-contributed data before merging PRs
- Keep dependencies updated: `npm audit fix`

---

**Your BBFL website is now live! 🥊**

For questions or issues, open a GitHub issue or consult the README.md.
