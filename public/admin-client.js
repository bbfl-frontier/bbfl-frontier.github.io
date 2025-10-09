// BBFL Admin Client - Static file management
let divisions = [];
let fighters = [];
let events = [];
let venues = [];
let bouts = [];
let results = [];

// Load data from JSON files
async function loadData() {
  try {
    const [divisionsRes, venuesRes] = await Promise.all([
      fetch('/data/divisions.json'),
      fetch('/data/venues.json')
    ]);

    divisions = await divisionsRes.json();
    venues = await venuesRes.json();

    await Promise.all([
      loadFighters(),
      loadEvents(),
      loadBouts(),
      loadResults()
    ]);

    populateDivisionDropdowns();
    populateVenueDropdown();
    populateFighterDropdowns();
    populateEventDropdown();
    populateBoutDropdown();

  } catch (error) {
    console.error('Error loading data:', error);
  }
}

function showMessage(elementId, message, isError = false) {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.className = `message ${isError ? 'error' : 'success'}`;
  el.textContent = message;
  setTimeout(() => {
    el.className = 'message';
    el.textContent = '';
  }, 5000);
}

// ===== FIGHTERS =====

async function loadFighters() {
  try {
    const response = await fetch('/fighters.json');
    if (response.ok) {
      fighters = await response.json();
    } else {
      // Fallback: try to load individual fighter files
      fighters = [];
    }
    renderFighters();
  } catch (error) {
    console.error('Error loading fighters:', error);
    fighters = [];
  }
}

function renderFighters() {
  const list = document.getElementById('fighter-list');
  if (!list) return;

  if (fighters.length === 0) {
    list.innerHTML = '<p class="text-gray-500">No fighters yet.</p>';
    return;
  }

  list.innerHTML = fighters
    .sort((a, b) => `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`))
    .map(f => {
      const div = divisions.find(d => d.id === f.divisionId);
      return `
        <div class="item">
          <div class="item-info">
            <strong>${f.firstName} ${f.lastName}</strong>
            ${f.nickname ? `<em>"${f.nickname}"</em>` : ''}
            <div class="item-meta">
              ${f.weight} lbs • ${f.height || 'N/A'} • ${div?.name || f.divisionId}
              ${f.fightingStyle ? ` • ${f.fightingStyle}` : ''}
              ${!f.active ? ' • <span style="color:red;">INACTIVE</span>' : ''}
            </div>
          </div>
          <div class="actions">
            <button class="btn btn-secondary" onclick="downloadFighterJSON('${f.id}')">Download JSON</button>
          </div>
        </div>
      `;
    }).join('');

  populateFighterDropdowns();
}

function populateDivisionDropdowns() {
  ['fighter-division', 'bout-division'].forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;

    select.innerHTML = '<option value="">Select Division</option>';
    divisions.forEach(div => {
      const option = document.createElement('option');
      option.value = div.id;
      option.textContent = `${div.name} (${div.description})`;
      select.appendChild(option);
    });
  });
}

function populateFighterDropdowns() {
  ['bout-fighter1', 'bout-fighter2'].forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;

    select.innerHTML = '<option value="">Select Fighter</option>';
    fighters
      .filter(f => f.active)
      .sort((a, b) => `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`))
      .forEach(f => {
        const option = document.createElement('option');
        option.value = f.id;
        option.textContent = `${f.firstName} ${f.lastName}${f.nickname ? ` "${f.nickname}"` : ''}`;
        select.appendChild(option);
      });
  });
}

document.getElementById('fighter-form')?.addEventListener('submit', (e) => {
  e.preventDefault();

  const fighter = {
    id: document.getElementById('fighter-id').value,
    firstName: document.getElementById('fighter-firstname').value,
    lastName: document.getElementById('fighter-lastname').value,
    nickname: document.getElementById('fighter-nickname').value,
    weight: parseInt(document.getElementById('fighter-weight').value),
    height: document.getElementById('fighter-height').value,
    divisionId: document.getElementById('fighter-division').value,
    fightingStyle: document.getElementById('fighter-style').value,
    country: document.getElementById('fighter-country').value,
    bio: document.getElementById('fighter-bio').value,
    active: document.getElementById('fighter-active').value === 'true',
    image: document.getElementById('fighter-image').value || ''
  };

  downloadJSON(fighter, `${fighter.id}.json`);
  showMessage('fighter-message', `Download ${fighter.id}.json and place it in data/fighters/ folder`);

  // Also create bio file content
  const bioContent = fighter.bio || 'No bio available.';
  const bioBlob = new Blob([bioContent], { type: 'text/markdown' });
  const bioUrl = URL.createObjectURL(bioBlob);
  const bioLink = document.createElement('a');
  bioLink.href = bioUrl;
  bioLink.download = `${fighter.id}.md`;
  bioLink.click();

  showMessage('fighter-message', `Download both files and place them in the correct folders, then rebuild the site`);
  document.getElementById('fighter-form').reset();
});

function downloadFighterJSON(id) {
  const fighter = fighters.find(f => f.id === id);
  if (fighter) {
    downloadJSON(fighter, `${id}.json`);
  }
}

// ===== EVENTS =====

async function loadEvents() {
  try {
    const response = await fetch('/events.json');
    if (response.ok) {
      events = await response.json();
    } else {
      events = [];
    }
    renderEvents();
  } catch (error) {
    console.error('Error loading events:', error);
    events = [];
  }
}

function renderEvents() {
  const list = document.getElementById('event-list');
  if (!list) return;

  if (events.length === 0) {
    list.innerHTML = '<p class="text-gray-500">No events yet.</p>';
    return;
  }

  list.innerHTML = events.map(e => {
    const venue = venues.find(v => v.id === e.venueId);
    return `
      <div class="item">
        <div class="item-info">
          <strong>${e.title}</strong>
          <div class="item-meta">
            ${e.date} @ ${e.time} • ${venue?.name || e.venueId}
            • <span style="text-transform:uppercase;font-weight:bold;">${e.status}</span>
          </div>
        </div>
        <div class="actions">
          <button class="btn btn-secondary" onclick="downloadEventJSON('${e.id}')">Download JSON</button>
        </div>
      </div>
    `;
  }).join('');

  populateEventDropdown();
}

function populateVenueDropdown() {
  const select = document.getElementById('event-venue');
  if (!select) return;

  select.innerHTML = '<option value="">Select Venue</option>';
  venues.forEach(venue => {
    const option = document.createElement('option');
    option.value = venue.id;
    option.textContent = `${venue.name} - ${venue.location}`;
    select.appendChild(option);
  });
}

function populateEventDropdown() {
  const select = document.getElementById('bout-event');
  if (!select) return;

  select.innerHTML = '<option value="">Select Event</option>';
  events
    .filter(e => e.status === 'upcoming')
    .forEach(e => {
      const option = document.createElement('option');
      option.value = e.id;
      option.textContent = e.title;
      select.appendChild(option);
    });
}

document.getElementById('event-form')?.addEventListener('submit', (e) => {
  e.preventDefault();

  const event = {
    id: document.getElementById('event-id').value,
    slug: document.getElementById('event-slug').value,
    title: document.getElementById('event-title').value,
    subtitle: document.getElementById('event-subtitle').value,
    date: document.getElementById('event-date').value,
    time: document.getElementById('event-time').value,
    timezone: 'America/New_York',
    venueId: document.getElementById('event-venue').value,
    status: document.getElementById('event-status').value,
    description: document.getElementById('event-description').value,
    posterImage: `/images/events/${event.id}-poster.jpg`,
    bouts: []
  };

  downloadJSON(event, `${event.id}.json`);
  showMessage('event-message', `Download ${event.id}.json and place it in data/events/ folder, then rebuild`);
  document.getElementById('event-form').reset();
});

function downloadEventJSON(id) {
  const event = events.find(e => e.id === id);
  if (event) {
    downloadJSON(event, `${id}.json`);
  }
}

// ===== BOUTS =====

async function loadBouts() {
  try {
    const response = await fetch('/bouts.json');
    if (response.ok) {
      bouts = await response.json();
    } else {
      bouts = [];
    }
    renderBouts();
  } catch (error) {
    console.error('Error loading bouts:', error);
    bouts = [];
  }
}

function renderBouts() {
  const list = document.getElementById('bout-list');
  if (!list) return;

  if (bouts.length === 0) {
    list.innerHTML = '<p class="text-gray-500">No bouts scheduled yet.</p>';
    return;
  }

  // Group by event
  const boutsByEvent = {};
  bouts.forEach(b => {
    if (!boutsByEvent[b.eventId]) boutsByEvent[b.eventId] = [];
    boutsByEvent[b.eventId].push(b);
  });

  list.innerHTML = Object.entries(boutsByEvent).map(([eventId, eventBouts]) => {
    const event = events.find(e => e.id === eventId);
    return `
      <div style="margin-bottom: 2rem;">
        <h3 style="color: #7B2E2E; margin-bottom: 1rem; font-weight: bold;">${event?.title || eventId}</h3>
        ${eventBouts
          .sort((a, b) => a.order - b.order)
          .map(b => {
            const f1 = fighters.find(f => f.id === b.fighter1Id);
            const f2 = fighters.find(f => f.id === b.fighter2Id);
            const div = divisions.find(d => d.id === b.divisionId);
            return `
              <div class="item">
                <div class="item-info">
                  <strong>${f1?.firstName} ${f1?.lastName}</strong> vs <strong>${f2?.firstName} ${f2?.lastName}</strong>
                  <div class="item-meta">
                    ${div?.name || b.divisionId} • ${b.rounds} rounds • Bout #${b.order}
                    ${b.forChampionship ? ' • <span style="color:gold;">CHAMPIONSHIP</span>' : ''}
                  </div>
                </div>
                <div class="actions">
                  <button class="btn btn-secondary" onclick="downloadBoutJSON('${b.id}')">Download JSON</button>
                </div>
              </div>
            `;
          }).join('')}
      </div>
    `;
  }).join('');

  populateBoutDropdown();
}

function populateBoutDropdown() {
  const select = document.getElementById('result-bout');
  if (!select) return;

  select.innerHTML = '<option value="">Select Bout</option>';
  bouts
    .sort((a, b) => a.order - b.order)
    .forEach(b => {
      const f1 = fighters.find(f => f.id === b.fighter1Id);
      const f2 = fighters.find(f => f.id === b.fighter2Id);
      const event = events.find(e => e.id === b.eventId);

      const option = document.createElement('option');
      option.value = b.id;
      option.dataset.fighter1 = b.fighter1Id;
      option.dataset.fighter2 = b.fighter2Id;
      option.textContent = `${event?.title || ''} - ${f1?.lastName} vs ${f2?.lastName}`;
      select.appendChild(option);
    });
}

document.getElementById('bout-form')?.addEventListener('submit', (e) => {
  e.preventDefault();

  const bout = {
    id: document.getElementById('bout-id').value,
    eventId: document.getElementById('bout-event').value,
    fighter1Id: document.getElementById('bout-fighter1').value,
    fighter2Id: document.getElementById('bout-fighter2').value,
    divisionId: document.getElementById('bout-division').value,
    rounds: parseInt(document.getElementById('bout-rounds').value),
    order: parseInt(document.getElementById('bout-order').value),
    forChampionship: document.getElementById('bout-championship').value === 'true'
  };

  downloadJSON(bout, `${bout.id}.json`);
  showMessage('bout-message', `Download ${bout.id}.json and place it in data/bouts/ folder, then rebuild`);
  document.getElementById('bout-form').reset();
});

function downloadBoutJSON(id) {
  const bout = bouts.find(b => b.id === id);
  if (bout) {
    downloadJSON(bout, `${id}.json`);
  }
}

// ===== RESULTS =====

async function loadResults() {
  try {
    const response = await fetch('/results.json');
    if (response.ok) {
      results = await response.json();
    } else {
      results = [];
    }
    renderResults();
  } catch (error) {
    console.error('Error loading results:', error);
    results = [];
  }
}

function renderResults() {
  const list = document.getElementById('result-list');
  if (!list) return;

  if (results.length === 0) {
    list.innerHTML = '<p class="text-gray-500">No results yet.</p>';
    return;
  }

  list.innerHTML = results
    .slice(-10)
    .reverse()
    .map(r => {
      const bout = bouts.find(b => b.id === r.boutId);
      const winner = r.winnerId ? fighters.find(f => f.id === r.winnerId) : null;

      return `
        <div class="item">
          <div class="item-info">
            <strong>Bout: ${bout?.id || r.boutId}</strong>
            <div class="item-meta">
              Winner: ${winner ? `${winner.firstName} ${winner.lastName}` : 'Draw'}
              • ${r.method}
              ${r.round ? ` • Round ${r.round}` : ''}
              ${r.time ? ` at ${r.time}` : ''}
              ${r.performanceBonus ? ' • <span style="color:gold;">⭐ BONUS</span>' : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
}

// Show/hide scorecard
document.getElementById('result-method')?.addEventListener('change', (e) => {
  const scorecardSection = document.getElementById('scorecard-section');
  if (scorecardSection) {
    scorecardSection.classList.toggle('hidden', e.target.value !== 'Decision');
  }
});

// Populate winner when bout selected
document.getElementById('result-bout')?.addEventListener('change', (e) => {
  const select = e.target;
  const selectedOption = select.options[select.selectedIndex];

  const fighter1Id = selectedOption.dataset.fighter1;
  const fighter2Id = selectedOption.dataset.fighter2;

  const winnerSelect = document.getElementById('result-winner');
  if (!winnerSelect) return;

  winnerSelect.innerHTML = '<option value="">Select Winner</option>';

  if (fighter1Id && fighter2Id) {
    const f1 = fighters.find(f => f.id === fighter1Id);
    const f2 = fighters.find(f => f.id === fighter2Id);

    [f1, f2].forEach(f => {
      if (f) {
        const option = document.createElement('option');
        option.value = f.id;
        option.textContent = `${f.firstName} ${f.lastName}`;
        winnerSelect.appendChild(option);
      }
    });

    const drawOption = document.createElement('option');
    drawOption.value = 'draw';
    drawOption.textContent = 'Draw';
    winnerSelect.appendChild(drawOption);
  }
});

document.getElementById('result-form')?.addEventListener('submit', (e) => {
  e.preventDefault();

  const boutId = document.getElementById('result-bout').value;
  const method = document.getElementById('result-method').value;
  const winnerId = document.getElementById('result-winner').value;

  const result = {
    boutId,
    winnerId: winnerId === 'draw' ? null : winnerId,
    method,
    round: parseInt(document.getElementById('result-round').value) || null,
    time: document.getElementById('result-time').value || null,
    performanceBonus: document.getElementById('result-bonus').value === 'true'
  };

  // Add scorecard if decision
  if (method === 'Decision') {
    result.scorecard = {
      judge1: document.getElementById('result-judge1').value.split(',').map(s => s.trim()),
      judge2: document.getElementById('result-judge2').value.split(',').map(s => s.trim()),
      judge3: document.getElementById('result-judge3').value.split(',').map(s => s.trim())
    };
  }

  downloadJSON(result, `${boutId}.json`);
  showMessage('result-message', `Download ${boutId}.json and place it in data/results/ folder, then rebuild to update rankings`);
  document.getElementById('result-form').reset();
  document.getElementById('scorecard-section').classList.add('hidden');
});

// ===== UTILITIES =====

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Initialize
loadData();
