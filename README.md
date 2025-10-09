# Blood & Bourbon Fight League Website

**"Where honor meets the dirt."**

A production-ready static website for the Blood & Bourbon Fight League (BBFL), a RedM roleplay UFC-style fight league. Built with Astro, TypeScript, and Tailwind CSS, and designed to run entirely on GitHub Pages with no backend infrastructure.

## 🚀 Features

- **Static-First Architecture**: 100% static generation, no databases or APIs required
- **Automated Scheduling**: Biweekly Saturday 9 PM ET events computed automatically
- **Dynamic Rankings**: Fighter rankings and records calculated at build time
- **Responsive Design**: Modern, mobile-friendly UI with rustic Western aesthetics
- **Content-Driven**: All data managed through simple JSON files
- **GitHub Pages Ready**: Optimized for deployment via GitHub Actions

## 📋 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/<YOUR_USERNAME>/bbfl-website.git
cd bbfl-website

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
bbfl-website/
├── data/                      # Source data (edit these!)
│   ├── divisions.json         # Weight divisions
│   ├── fighters/*.json        # Fighter profiles
│   ├── fighters/bios/*.md     # Fighter biographies
│   ├── venues.json            # Fight venues
│   ├── belts.json             # Championship belts
│   ├── events/*.json          # Event information
│   ├── bouts/*.json           # Individual bouts
│   ├── results/*.json         # Bout results
│   ├── media.json             # Gallery images
│   ├── sponsors.json          # League sponsors
│   └── settings.json          # League settings
├── generated/                 # Auto-generated files (don't edit!)
│   ├── rankings.json          # Computed rankings
│   ├── records.json           # Fighter records
│   ├── next-event.json        # Next event calculation
│   └── search-index.json      # Search data
├── scripts/                   # Build scripts
│   ├── types.ts               # TypeScript types
│   ├── recompute.ts           # Rankings/records computation
│   ├── nextEvent.ts           # Event scheduling
│   └── build.ts               # Pre-build orchestrator
├── src/
│   ├── components/            # Astro components
│   ├── layouts/               # Page layouts
│   ├── pages/                 # Routes (auto-generated)
│   └── styles/                # Global styles
└── public/                    # Static assets
```

## ⚙️ Configuration

### 1. Update GitHub Pages Settings

In `astro.config.mjs`, replace `<YOUR_GITHUB_USERNAME>` with your actual GitHub username:

```js
export default defineConfig({
  site: 'https://<YOUR_USERNAME>.github.io',
  base: '/bbfl-website/',
  // ...
});
```

### 2. Enable GitHub Pages

1. Go to your repository settings
2. Navigate to **Pages** → **Source**
3. Select **GitHub Actions** as the source
4. Push to `main` branch to trigger deployment

## 📝 Content Management

### Adding a Fighter

1. Create `data/fighters/fighter-name.json`:

```json
{
  "id": "fighter-name",
  "firstName": "John",
  "lastName": "Doe",
  "nickname": "The Hammer",
  "divisionId": "middle",
  "weight": 175,
  "height": "5'11\"",
  "reach": "74\"",
  "stance": "Orthodox",
  "nationality": "American",
  "age": 28,
  "bioFile": "fighter-name.md",
  "active": true,
  "debut": "2025-01-18"
}
```

2. Create `data/fighters/bios/fighter-name.md` with their biography

### Creating an Event

1. Create `data/events/event-slug.json`:

```json
{
  "id": "bbfl-002",
  "slug": "bbfl-002-title",
  "title": "BBFL 002: Title Fight",
  "date": "2025-02-01",
  "time": "21:00",
  "timezone": "America/New_York",
  "venueId": "saloon",
  "status": "upcoming",
  "description": "Championship night",
  "bouts": ["bout-004", "bout-005"]
}
```

2. Create bout files in `data/bouts/`
3. After the event, add results in `data/results/`

### Updating Rankings

Rankings are computed automatically on each build. The system:

- Awards **+3 points** for wins
- Awards **+2 bonus points** for finishes (KO/TKO/Submission)
- Awards **+1 point** for draws
- Awards **0 points** for losses

## 🎨 Customization

### Theme Colors

Edit CSS variables in `src/styles/global.css`:

```css
:root {
  --bourbon-red: #7B2E2E;
  --bourbon-dark: #4A1B1B;
  --parchment: #F5F1E8;
  --charcoal: #2C2C2C;
}
```

### League Settings

Edit `data/settings.json` to change:
- League name and tagline
- Event schedule
- Prize purses
- Contact information

## 🏗️ Build Process

The build runs in this order:

1. **Pre-build Scripts** (`npm run prebuild`)
   - `scripts/recompute.ts` - Computes rankings and records
   - `scripts/nextEvent.ts` - Calculates next event date/time

2. **Astro Build** (`npm run build`)
   - Generates static pages from data
   - Outputs to `/dist` directory

3. **Deploy** (GitHub Actions)
   - Uploads build artifacts
   - Publishes to GitHub Pages

## 📅 Event Scheduling

Events occur **every other Saturday at 9:00 PM ET**. The system automatically:

- Calculates the next event based on the biweekly cadence
- Displays countdown timer on homepage
- Uses Luxon for timezone-accurate date handling

Reference date: First event on **January 18, 2025**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-fighter`
3. Add data files in `/data`
4. Commit changes: `git commit -am 'Add new fighter'`
5. Push to branch: `git push origin feature/new-fighter`
6. Create a Pull Request

## 📦 Technologies

- **Astro 5** - Static site generator
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Luxon** - Date/time handling
- **GitHub Actions** - CI/CD
- **GitHub Pages** - Hosting

## 📄 License

MIT License - Feel free to use this for your own fight league!

## 🆘 Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Join our Discord: [Link from settings.json]
- Email: [Link from settings.json]

---

**Built with ❤️ for the RedM roleplay community**
