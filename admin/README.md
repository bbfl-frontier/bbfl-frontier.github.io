# BBFL Admin Portal

Complete admin interface for managing the Blood & Bourbon Fight League website.

## Features

### 🥊 Fighter Management
- Add new fighters with full details (name, nickname, weight, height, division, fighting style)
- Edit existing fighters
- Upload fighter images
- Set fighter active/inactive status
- Delete fighters
- Automatic bio file management

### 📅 Event Management
- Create new events with venue and date/time
- Edit event details
- Set event status (upcoming, live, completed, cancelled)
- Automatic slug generation

### 🎯 Fight Card Management
- Add bouts to event fight cards
- Select fighters and division
- Set number of rounds and bout order
- Mark championship bouts
- View all scheduled bouts by event

### 📊 Results & Scorecards
- Submit fight results with winner and method
- Record finish details (round, time)
- Full judges' scorecard support for decisions
- Performance bonus tracking
- **Automatic ranking updates** after result submission

## How to Use

### Start the Admin Portal

```bash
npm run admin
```

The admin portal will open at: **http://localhost:3001**

### Workflow

1. **Add Fighters**
   - Go to Fighters tab
   - Fill in fighter details
   - Upload fighter image (optional)
   - Submit

2. **Create Event**
   - Go to Events tab
   - Enter event details (ID, title, date, venue)
   - Set status to "upcoming"
   - Submit

3. **Build Fight Card**
   - Go to Fight Card tab
   - Select event
   - Add bouts with fighter matchups
   - Set bout order for fight card display

4. **Submit Results**
   - Go to Results tab
   - Select bout from dropdown
   - Choose winner and method
   - For decisions: enter judges' scorecards (e.g., "10-9,10-9,10-8")
   - Submit result
   - **Rankings automatically rebuild!**

## Technical Details

- **Backend**: Express.js server with file-based storage
- **Frontend**: Vanilla JavaScript with modern UI
- **Image Upload**: Multer for handling fighter photos
- **Auto-Rankings**: Triggers build script after result submission
- **Data Format**: All data stored as JSON files in `/data` directory

## File Structure

```
admin/
├── server.js          # Express API server
├── public/
│   ├── index.html    # Admin UI
│   └── app.js        # Frontend logic
└── README.md         # This file
```

## API Endpoints

- `GET/POST/PUT/DELETE /api/fighters`
- `GET/POST/PUT /api/events`
- `GET/POST /api/bouts`
- `GET/POST /api/results`
- `GET /api/divisions`
- `GET /api/venues`
- `POST /api/fighters/:id/image`

## Notes

- Admin portal runs on port 3001 (website dev server on 4321)
- All changes write directly to data files
- Rankings rebuild automatically when results are submitted
- Fighter images saved to `/public/images/fighters/`
- Remember to commit and push changes to deploy to GitHub Pages
