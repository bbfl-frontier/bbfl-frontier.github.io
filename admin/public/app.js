const API_URL = 'http://localhost:3001/api';

let divisions = [];
let fighters = [];
let events = [];
let venues = [];
let bouts = [];

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const targetTab = tab.dataset.tab;

    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));

    tab.classList.add('active');
    document.getElementById(targetTab).classList.add('active');

    // Load data when switching tabs
    if (targetTab === 'fighters') loadFighters();
    if (targetTab === 'events') loadEvents();
    if (targetTab === 'bouts') loadBouts();
    if (targetTab === 'results') loadResults();
  });
});

// ===== UTILITIES =====

function showMessage(elementId, message, isError = false) {
  const el = document.getElementById(elementId);
  el.className = isError ? 'error-message' : 'success-message';
  el.textContent = message;
  setTimeout(() => el.textContent = '', 5000);
}

// ===== INITIALIZATION =====

async function init() {
  // Load divisions, venues for dropdowns
  divisions = await fetch(`${API_URL}/divisions`).then(r => r.json());
  venues = await fetch(`${API_URL}/venues`).then(r => r.json());

  populateDivisionDropdowns();
  populateVenueDropdown();

  loadFighters();
}

function populateDivisionDropdowns() {
  const selects = ['fighter-division', 'bout-division'];
  selects.forEach(id => {
    const select = document.getElementById(id);
    select.innerHTML = '<option value="">Select Division</option>';
    divisions.forEach(div => {
      const option = document.createElement('option');
      option.value = div.id;
      option.textContent = `${div.name} (${div.description})`;
      select.appendChild(option);
    });
  });
}

function populateVenueDropdown() {
  const select = document.getElementById('event-venue');
  select.innerHTML = '<option value="">Select Venue</option>';
  venues.forEach(venue => {
    const option = document.createElement('option');
    option.value = venue.id;
    option.textContent = `${venue.name} - ${venue.location}`;
    select.appendChild(option);
  });
}

// ===== FIGHTERS =====

async function loadFighters() {
  fighters = await fetch(`${API_URL}/fighters`).then(r => r.json());

  const list = document.getElementById('fighter-list');
  if (fighters.length === 0) {
    list.innerHTML = '<p>No fighters yet.</p>';
    return;
  }

  list.innerHTML = fighters
    .sort((a, b) => `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`))
    .map(f => `
      <div class="fighter-item">
        <div class="fighter-info">
          <strong>${f.firstName} ${f.lastName}</strong>
          ${f.nickname ? `<em>"${f.nickname}"</em>` : ''}
          <div class="fighter-meta">
            ${f.weight} lbs • ${f.height || 'N/A'} • ${divisions.find(d => d.id === f.divisionId)?.name || f.divisionId}
            ${f.fightingStyle ? ` • ${f.fightingStyle}` : ''}
            ${!f.active ? ' • <span style="color:red;">INACTIVE</span>' : ''}
          </div>
        </div>
        <div class="actions">
          <button class="btn btn-sm btn-secondary" onclick="editFighter('${f.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteFighter('${f.id}')">Delete</button>
        </div>
      </div>
    `).join('');

  // Populate fighter dropdowns
  populateFighterDropdowns();
}

function populateFighterDropdowns() {
  const selects = ['bout-fighter1', 'bout-fighter2'];
  selects.forEach(id => {
    const select = document.getElementById(id);
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

document.getElementById('fighter-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const editId = document.getElementById('fighter-edit-id').value;
  const isEdit = !!editId;

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
    image: ''
  };

  try {
    const url = isEdit ? `${API_URL}/fighters/${editId}` : `${API_URL}/fighters`;
    const method = isEdit ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fighter)
    });

    if (!response.ok) throw new Error('Failed to save fighter');

    // Upload image if provided
    const imageFile = document.getElementById('fighter-image-upload').files[0];
    if (imageFile) {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('fighterId', fighter.id);

      await fetch(`${API_URL}/fighters/${fighter.id}/image`, {
        method: 'POST',
        body: formData
      });
    }

    showMessage('fighter-message', isEdit ? 'Fighter updated!' : 'Fighter added!');
    document.getElementById('fighter-form').reset();
    document.getElementById('fighter-edit-id').value = '';
    document.getElementById('fighter-form-title').textContent = 'Add New Fighter';
    document.getElementById('fighter-submit-btn').textContent = 'Add Fighter';
    document.getElementById('fighter-cancel-btn').style.display = 'none';
    document.getElementById('fighter-image-preview').classList.add('hidden');

    loadFighters();
  } catch (err) {
    showMessage('fighter-message', err.message, true);
  }
});

async function editFighter(id) {
  const fighter = fighters.find(f => f.id === id);
  if (!fighter) return;

  document.getElementById('fighter-edit-id').value = id;
  document.getElementById('fighter-id').value = fighter.id;
  document.getElementById('fighter-id').disabled = true;
  document.getElementById('fighter-firstname').value = fighter.firstName;
  document.getElementById('fighter-lastname').value = fighter.lastName;
  document.getElementById('fighter-nickname').value = fighter.nickname || '';
  document.getElementById('fighter-weight').value = fighter.weight;
  document.getElementById('fighter-height').value = fighter.height || '';
  document.getElementById('fighter-division').value = fighter.divisionId;
  document.getElementById('fighter-style').value = fighter.fightingStyle || '';
  document.getElementById('fighter-country').value = fighter.country || '';
  document.getElementById('fighter-bio').value = fighter.bio || '';
  document.getElementById('fighter-active').value = fighter.active ? 'true' : 'false';

  document.getElementById('fighter-form-title').textContent = 'Edit Fighter';
  document.getElementById('fighter-submit-btn').textContent = 'Update Fighter';
  document.getElementById('fighter-cancel-btn').style.display = 'inline-block';

  window.scrollTo(0, 0);
}

document.getElementById('fighter-cancel-btn').addEventListener('click', () => {
  document.getElementById('fighter-form').reset();
  document.getElementById('fighter-edit-id').value = '';
  document.getElementById('fighter-id').disabled = false;
  document.getElementById('fighter-form-title').textContent = 'Add New Fighter';
  document.getElementById('fighter-submit-btn').textContent = 'Add Fighter';
  document.getElementById('fighter-cancel-btn').style.display = 'none';
  document.getElementById('fighter-image-preview').classList.add('hidden');
});

async function deleteFighter(id) {
  if (!confirm('Are you sure you want to delete this fighter?')) return;

  try {
    await fetch(`${API_URL}/fighters/${id}`, { method: 'DELETE' });
    showMessage('fighter-message', 'Fighter deleted.');
    loadFighters();
  } catch (err) {
    showMessage('fighter-message', 'Failed to delete fighter.', true);
  }
}

// Image preview
document.getElementById('fighter-image-upload').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.getElementById('fighter-image-preview');
      preview.src = e.target.result;
      preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }
});

// ===== EVENTS =====

async function loadEvents() {
  events = await fetch(`${API_URL}/events`).then(r => r.json());

  const list = document.getElementById('event-list');
  if (events.length === 0) {
    list.innerHTML = '<p>No events yet.</p>';
    return;
  }

  list.innerHTML = events.map(e => `
    <div class="event-item">
      <div>
        <strong>${e.title}</strong>
        <div class="fighter-meta">
          ${e.date} @ ${e.time} • ${venues.find(v => v.id === e.venueId)?.name || e.venueId}
          • <span style="text-transform:uppercase;font-weight:bold;color:${e.status === 'upcoming' ? '#007bff' : e.status === 'completed' ? '#28a745' : '#6c757d'}">${e.status}</span>
        </div>
      </div>
      <div class="actions">
        <button class="btn btn-sm btn-secondary" onclick="editEvent('${e.id}')">Edit</button>
      </div>
    </div>
  `).join('');

  // Populate event dropdown for bouts
  populateEventDropdown();
}

function populateEventDropdown() {
  const select = document.getElementById('bout-event');
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

document.getElementById('event-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const editId = document.getElementById('event-edit-id').value;
  const isEdit = !!editId;

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
    posterImage: `/images/events/${document.getElementById('event-id').value}-poster.jpg`,
    bouts: []
  };

  try {
    const url = isEdit ? `${API_URL}/events/${editId}` : `${API_URL}/events`;
    const method = isEdit ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });

    if (!response.ok) throw new Error('Failed to save event');

    showMessage('event-message', isEdit ? 'Event updated!' : 'Event created!');
    document.getElementById('event-form').reset();
    document.getElementById('event-edit-id').value = '';
    document.getElementById('event-form-title').textContent = 'Create New Event';
    document.getElementById('event-submit-btn').textContent = 'Create Event';
    document.getElementById('event-cancel-btn').style.display = 'none';

    loadEvents();
  } catch (err) {
    showMessage('event-message', err.message, true);
  }
});

async function editEvent(id) {
  const event = events.find(e => e.id === id);
  if (!event) return;

  document.getElementById('event-edit-id').value = id;
  document.getElementById('event-id').value = event.id;
  document.getElementById('event-id').disabled = true;
  document.getElementById('event-slug').value = event.slug;
  document.getElementById('event-title').value = event.title;
  document.getElementById('event-subtitle').value = event.subtitle || '';
  document.getElementById('event-date').value = event.date;
  document.getElementById('event-time').value = event.time;
  document.getElementById('event-venue').value = event.venueId;
  document.getElementById('event-status').value = event.status;
  document.getElementById('event-description').value = event.description || '';

  document.getElementById('event-form-title').textContent = 'Edit Event';
  document.getElementById('event-submit-btn').textContent = 'Update Event';
  document.getElementById('event-cancel-btn').style.display = 'inline-block';

  window.scrollTo(0, 0);
}

document.getElementById('event-cancel-btn').addEventListener('click', () => {
  document.getElementById('event-form').reset();
  document.getElementById('event-edit-id').value = '';
  document.getElementById('event-id').disabled = false;
  document.getElementById('event-form-title').textContent = 'Create New Event';
  document.getElementById('event-submit-btn').textContent = 'Create Event';
  document.getElementById('event-cancel-btn').style.display = 'none';
});

// ===== BOUTS =====

async function loadBouts() {
  bouts = await fetch(`${API_URL}/bouts`).then(r => r.json());

  const list = document.getElementById('bout-list');
  if (bouts.length === 0) {
    list.innerHTML = '<p>No bouts scheduled yet.</p>';
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
        <h3 style="color: #7B2E2E; margin-bottom: 1rem;">${event?.title || eventId}</h3>
        ${eventBouts
          .sort((a, b) => a.order - b.order)
          .map(b => {
            const f1 = fighters.find(f => f.id === b.fighter1Id);
            const f2 = fighters.find(f => f.id === b.fighter2Id);
            const div = divisions.find(d => d.id === b.divisionId);
            return `
              <div class="bout-item">
                <div>
                  <strong>${f1?.firstName} ${f1?.lastName}</strong> vs <strong>${f2?.firstName} ${f2?.lastName}</strong>
                  <div class="fighter-meta">
                    ${div?.name || b.divisionId} • ${b.rounds} rounds • Bout #${b.order}
                    ${b.forChampionship ? ' • <span style="color:gold;">CHAMPIONSHIP BOUT</span>' : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
      </div>
    `;
  }).join('');

  // Populate bout dropdown for results
  populateBoutDropdown();
}

function populateBoutDropdown() {
  const select = document.getElementById('result-bout');
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

document.getElementById('bout-form').addEventListener('submit', async (e) => {
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

  try {
    const response = await fetch(`${API_URL}/bouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bout)
    });

    if (!response.ok) throw new Error('Failed to add bout');

    showMessage('bout-message', 'Bout added to fight card!');
    document.getElementById('bout-form').reset();

    loadBouts();
  } catch (err) {
    showMessage('bout-message', err.message, true);
  }
});

// ===== RESULTS =====

// Show/hide scorecard fields based on method
document.getElementById('result-method').addEventListener('change', (e) => {
  const scorecardSection = document.getElementById('scorecard-section');
  scorecardSection.style.display = e.target.value === 'Decision' ? 'block' : 'none';
});

// Populate winner dropdown when bout selected
document.getElementById('result-bout').addEventListener('change', (e) => {
  const select = e.target;
  const selectedOption = select.options[select.selectedIndex];

  const fighter1Id = selectedOption.dataset.fighter1;
  const fighter2Id = selectedOption.dataset.fighter2;

  const winnerSelect = document.getElementById('result-winner');
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

    // Add draw/no contest
    const drawOption = document.createElement('option');
    drawOption.value = 'draw';
    drawOption.textContent = 'Draw';
    winnerSelect.appendChild(drawOption);
  }
});

document.getElementById('result-form').addEventListener('submit', async (e) => {
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

  try {
    const response = await fetch(`${API_URL}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    });

    if (!response.ok) throw new Error('Failed to submit result');

    showMessage('result-message', 'Result submitted! Rankings updated automatically.');
    document.getElementById('result-form').reset();
    document.getElementById('scorecard-section').style.display = 'none';

    loadResults();
  } catch (err) {
    showMessage('result-message', err.message, true);
  }
});

async function loadResults() {
  const results = await fetch(`${API_URL}/results`).then(r => r.json());

  const list = document.getElementById('result-list');
  if (results.length === 0) {
    list.innerHTML = '<p>No results yet.</p>';
    return;
  }

  list.innerHTML = results
    .slice(-10)
    .reverse()
    .map(r => {
      const bout = bouts.find(b => b.id === r.boutId);
      const winner = r.winnerId ? fighters.find(f => f.id === r.winnerId) : null;

      return `
        <div class="bout-item">
          <div>
            <strong>${bout ? `Bout: ${bout.id}` : r.boutId}</strong>
            <div class="fighter-meta">
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

// ===== START =====

init();
