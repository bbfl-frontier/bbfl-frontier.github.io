// BBFL Admin Client - GitHub API Integration
let divisions = [];
let fighters = [];
let events = [];
let venues = [];
let bouts = [];
let results = [];

// GitHub Configuration
let GITHUB_TOKEN = localStorage.getItem('bbfl-github-token');
const GITHUB_OWNER = 'bbfl-frontier';
const GITHUB_REPO = 'bbfl-frontier.github.io';
const BRANCH = 'main';

// Check if token exists, if not prompt for it
if (!GITHUB_TOKEN) {
  GITHUB_TOKEN = prompt('Enter your GitHub Personal Access Token (with repo access):\n\nCreate one at: https://github.com/settings/tokens/new');
  if (GITHUB_TOKEN) {
    localStorage.setItem('bbfl-github-token', GITHUB_TOKEN);
  } else {
    alert('GitHub token is required to use the admin portal');
  }
}

// GitHub API Helper
async function githubAPI(endpoint, method = 'GET', body = null) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('bbfl-github-token');
        alert('Invalid GitHub token. Please refresh and enter a valid token.');
      }
      // Get more error details
      let errorMessage = `GitHub API Error (${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage += `: ${errorData.message || response.statusText}`;
      } catch (e) {
        errorMessage += `: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    return response.json();
  } catch (error) {
    console.error('GitHub API error:', error);
    throw error;
  }
}

// Get file from GitHub
async function getGitHubFile(path) {
  try {
    console.log('getGitHubFile - Fetching:', path);
    const data = await githubAPI(`contents/${path}?ref=${BRANCH}`);
    console.log('getGitHubFile - Response SHA:', data.sha);
    const content = atob(data.content);
    return { content, sha: data.sha };
  } catch (error) {
    console.error('getGitHubFile - Error:', error);
    return null;
  }
}

// Save file to GitHub
async function saveGitHubFile(path, content, message, sha = null) {
  const body = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch: BRANCH
  };

  if (sha) {
    body.sha = sha;
  }

  return await githubAPI(`contents/${path}`, 'PUT', body);
}

// Delete file from GitHub
async function deleteGitHubFile(path, message) {
  const file = await getGitHubFile(path);
  if (!file) return;

  return await githubAPI(`contents/${path}`, 'DELETE', {
    message,
    sha: file.sha,
    branch: BRANCH
  });
}

// Trigger GitHub Actions workflow to rebuild site
// Note: Site automatically rebuilds when changes are pushed to main branch
async function triggerRebuild() {
  // GitHub Pages automatically rebuilds on push to main
  // No manual trigger needed
  return true;
}

// Load data from GitHub
async function loadData() {
  try {
    // Load divisions and venues from GitHub
    const [divisionsFile, venuesFile] = await Promise.all([
      getGitHubFile('data/divisions.json'),
      getGitHubFile('data/venues.json')
    ]);

    divisions = divisionsFile ? JSON.parse(divisionsFile.content) : [];
    venues = venuesFile ? JSON.parse(venuesFile.content) : [];

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
    alert('Error loading data. Please check your GitHub token and try again.');
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
    // Load from public JSON first for faster access
    const response = await fetch(`/fighters.json?t=${Date.now()}`);
    if (response.ok) {
      fighters = await response.json();
      console.log('Loaded fighters from public JSON:', fighters.length);
    } else {
      // Fallback to GitHub API
      console.warn('Failed to load fighters.json, falling back to GitHub API');
      const contents = await githubAPI(`contents/data/fighters?ref=${BRANCH}`);
      const fighterFiles = contents.filter(f => f.name.endsWith('.json') && f.name !== '.gitkeep');

      fighters = [];
      for (const file of fighterFiles) {
        const fighterData = await getGitHubFile(file.path);
        if (fighterData) {
          fighters.push(JSON.parse(fighterData.content));
        }
      }
    }

    renderFighters();
  } catch (error) {
    console.error('Error loading fighters:', error);
    fighters = [];
    renderFighters();
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
              ${f.coach ? ` • Coach: ${f.coach}` : ''}
              ${!f.active ? ' • <span style="color:red;">INACTIVE</span>' : ''}
            </div>
          </div>
          <div class="actions">
            <button class="btn btn-primary" onclick="editFighter('${f.id}')">Edit</button>
            <button class="btn btn-danger" onclick="deleteFighter('${f.id}')">Delete</button>
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

document.getElementById('fighter-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const editMode = document.getElementById('fighter-edit-id')?.value;
  const fighterId = document.getElementById('fighter-id').value;
  const bio = document.getElementById('fighter-bio').value;

  const fighter = {
    id: fighterId,
    firstName: document.getElementById('fighter-firstname').value,
    lastName: document.getElementById('fighter-lastname').value,
    nickname: document.getElementById('fighter-nickname').value,
    weight: parseInt(document.getElementById('fighter-weight').value),
    height: document.getElementById('fighter-height').value,
    reach: document.getElementById('fighter-reach')?.value || '',
    stance: document.getElementById('fighter-stance')?.value || '',
    divisionId: document.getElementById('fighter-division').value,
    fightingStyle: document.getElementById('fighter-style').value,
    age: document.getElementById('fighter-age')?.value ? parseInt(document.getElementById('fighter-age').value) : null,
    nationality: document.getElementById('fighter-nationality')?.value || '',
    country: document.getElementById('fighter-country').value,
    debut: document.getElementById('fighter-debut')?.value || '',
    coach: document.getElementById('fighter-coach')?.value || '',
    active: document.getElementById('fighter-active').value === 'true',
    image: document.getElementById('fighter-image').value || '/images/fighters/placeholder.jpg',
    record: { wins: 0, losses: 0, draws: 0 },
    rankingPoints: 0
  };

  try {
    // Save fighter JSON
    const fighterPath = `data/fighters/${fighterId}.json`;
    const existingFile = await getGitHubFile(fighterPath);

    // Preserve record and ranking if editing
    if (existingFile) {
      const existing = JSON.parse(existingFile.content);
      fighter.record = existing.record || fighter.record;
      fighter.rankingPoints = existing.rankingPoints || 0;
    }

    await saveGitHubFile(
      fighterPath,
      JSON.stringify(fighter, null, 2),
      editMode ? `Update fighter: ${fighter.firstName} ${fighter.lastName}` : `Add fighter: ${fighter.firstName} ${fighter.lastName}`,
      existingFile?.sha
    );

    // Save bio
    if (bio) {
      const bioPath = `data/fighters/bios/${fighterId}.md`;
      const existingBio = await getGitHubFile(bioPath);
      await saveGitHubFile(
        bioPath,
        bio,
        `Update bio for ${fighter.firstName} ${fighter.lastName}`,
        existingBio?.sha
      );
    }

    showMessage('fighter-message', editMode ? 'Fighter updated successfully! Rebuilding site...' : 'Fighter added successfully! Rebuilding site...');
    document.getElementById('fighter-form').reset();
    document.getElementById('fighter-edit-id').value = '';
    document.getElementById('fighter-form-title').textContent = 'Add New Fighter';
    document.getElementById('fighter-submit-btn').textContent = 'Add Fighter';
    document.getElementById('fighter-cancel-btn').classList.add('hidden');

    await loadFighters();

    // Trigger rebuild
    const rebuilt = await triggerRebuild();
    if (rebuilt) {
      showMessage('fighter-message', 'Site rebuild triggered! Rankings will update in ~2-3 minutes.');
    }
  } catch (error) {
    console.error('Error saving fighter:', error);
    showMessage('fighter-message', 'Error saving fighter: ' + error.message, true);
  }
});

// Edit fighter
window.editFighter = async function(id) {
  const fighter = fighters.find(f => f.id === id);
  if (!fighter) return;

  document.getElementById('fighter-edit-id').value = id;
  document.getElementById('fighter-id').value = fighter.id;
  document.getElementById('fighter-firstname').value = fighter.firstName;
  document.getElementById('fighter-lastname').value = fighter.lastName;
  document.getElementById('fighter-nickname').value = fighter.nickname || '';
  document.getElementById('fighter-weight').value = fighter.weight;
  document.getElementById('fighter-height').value = fighter.height || '';
  if (document.getElementById('fighter-reach')) {
    document.getElementById('fighter-reach').value = fighter.reach || '';
  }
  if (document.getElementById('fighter-stance')) {
    document.getElementById('fighter-stance').value = fighter.stance || '';
  }
  document.getElementById('fighter-division').value = fighter.divisionId;
  document.getElementById('fighter-style').value = fighter.fightingStyle || '';
  if (document.getElementById('fighter-age')) {
    document.getElementById('fighter-age').value = fighter.age || '';
  }
  if (document.getElementById('fighter-nationality')) {
    document.getElementById('fighter-nationality').value = fighter.nationality || '';
  }
  document.getElementById('fighter-country').value = fighter.country || '';
  if (document.getElementById('fighter-debut')) {
    document.getElementById('fighter-debut').value = fighter.debut || '';
  }
  if (document.getElementById('fighter-coach')) {
    document.getElementById('fighter-coach').value = fighter.coach || '';
  }
  document.getElementById('fighter-active').value = fighter.active ? 'true' : 'false';
  document.getElementById('fighter-image').value = fighter.image || '';

  // Load bio
  const bioFile = await getGitHubFile(`data/fighters/bios/${id}.md`);
  if (bioFile) {
    document.getElementById('fighter-bio').value = bioFile.content;
  }

  document.getElementById('fighter-form-title').textContent = 'Edit Fighter';
  document.getElementById('fighter-submit-btn').textContent = 'Update Fighter';
  document.getElementById('fighter-cancel-btn').classList.remove('hidden');

  // Scroll to form
  document.getElementById('fighter-form').scrollIntoView({ behavior: 'smooth' });
};

// Delete fighter
window.deleteFighter = async function(id) {
  if (!confirm('Are you sure you want to delete this fighter?')) return;

  try {
    const fighter = fighters.find(f => f.id === id);
    await deleteGitHubFile(`data/fighters/${id}.json`, `Delete fighter: ${fighter.firstName} ${fighter.lastName}`);

    // Try to delete bio if exists
    try {
      await deleteGitHubFile(`data/fighters/bios/${id}.md`, `Delete bio for ${fighter.firstName} ${fighter.lastName}`);
    } catch (e) {
      // Bio might not exist, ignore error
    }

    await loadFighters();
    showMessage('fighter-message', 'Fighter deleted successfully! Rebuilding site...');

    // Trigger rebuild
    const rebuilt = await triggerRebuild();
    if (rebuilt) {
      showMessage('fighter-message', 'Site rebuild triggered! Rankings will update in ~2-3 minutes.');
    }
  } catch (error) {
    showMessage('fighter-message', 'Error deleting fighter: ' + error.message, true);
  }
};

// Cancel fighter edit
document.getElementById('fighter-cancel-btn')?.addEventListener('click', () => {
  document.getElementById('fighter-form').reset();
  document.getElementById('fighter-edit-id').value = '';
  document.getElementById('fighter-form-title').textContent = 'Add New Fighter';
  document.getElementById('fighter-submit-btn').textContent = 'Add Fighter';
  document.getElementById('fighter-cancel-btn').classList.add('hidden');
});

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

document.getElementById('event-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const eventId = document.getElementById('event-id').value;

  const event = {
    id: eventId,
    slug: document.getElementById('event-slug').value,
    title: document.getElementById('event-title').value,
    subtitle: document.getElementById('event-subtitle').value,
    date: document.getElementById('event-date').value,
    time: document.getElementById('event-time').value,
    timezone: 'America/New_York',
    venueId: document.getElementById('event-venue').value,
    status: document.getElementById('event-status').value,
    description: document.getElementById('event-description').value,
    posterImage: `/images/events/${eventId}-poster.jpg`,
    bouts: []
  };

  try {
    // Save event to GitHub
    const eventPath = `data/events/${eventId}.json`;
    await saveGitHubFile(
      eventPath,
      JSON.stringify(event, null, 2),
      `Add event: ${event.title}`
    );

    showMessage('event-message', 'Event created successfully! Rebuilding site...');
    document.getElementById('event-form').reset();

    await loadEvents();

    // Trigger rebuild
    const rebuilt = await triggerRebuild();
    if (rebuilt) {
      showMessage('event-message', 'Site rebuild triggered! Event will be live in ~2-3 minutes.');
    }
  } catch (error) {
    console.error('Error creating event:', error);
    showMessage('event-message', 'Error creating event: ' + error.message, true);
  }
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
    // Add timestamp to prevent caching
    const response = await fetch(`/bouts.json?t=${Date.now()}`);
    if (response.ok) {
      bouts = await response.json();
      console.log('Loaded bouts:', bouts);
    } else {
      console.warn('Failed to load bouts.json:', response.status, response.statusText);
      bouts = [];
    }
    renderBouts();
  } catch (error) {
    console.error('Error loading bouts:', error);
    bouts = [];
    renderBouts();
  }
}

function renderBouts() {
  const list = document.getElementById('bout-list');
  if (!list) {
    console.warn('bout-list element not found');
    return;
  }

  console.log('Rendering bouts, count:', bouts.length);
  console.log('Fighters available:', fighters.length);

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
                  <button class="btn btn-danger" onclick="deleteBout('${b.id}', '${b.eventId}')">Delete</button>
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

document.getElementById('bout-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const eventId = document.getElementById('bout-event').value;
  const boutOrder = parseInt(document.getElementById('bout-order').value);

  // Auto-generate bout ID: {eventId}-bout-{order}
  const boutId = `${eventId}-bout-${boutOrder}`;

  const bout = {
    id: boutId,
    eventId: eventId,
    fighter1Id: document.getElementById('bout-fighter1').value,
    fighter2Id: document.getElementById('bout-fighter2').value,
    divisionId: document.getElementById('bout-division').value,
    rounds: parseInt(document.getElementById('bout-rounds').value),
    order: boutOrder,
    forChampionship: document.getElementById('bout-championship').value === 'true'
  };

  try {
    // Save bout to GitHub - check if it exists first to get SHA
    const boutPath = `data/bouts/${bout.id}.json`;
    const existingBout = await getGitHubFile(boutPath);

    if (existingBout) {
      console.warn('Bout file already exists, updating with SHA:', existingBout.sha);
    }

    await saveGitHubFile(
      boutPath,
      JSON.stringify(bout, null, 2),
      existingBout ? `Update bout: ${bout.id}` : `Add bout: ${bout.id}`,
      existingBout?.sha
    );

    // Update event to include this bout - MUST fetch fresh from GitHub for correct SHA
    const eventPath = `data/events/${bout.eventId}.json`;

    // Add small delay to ensure previous commit is processed
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('Fetching event file from GitHub:', eventPath);
    const eventFile = await getGitHubFile(eventPath);
    console.log('Event file fetched:', eventFile ? 'SUCCESS' : 'NULL', eventFile ? `SHA: ${eventFile.sha}` : '');

    if (!eventFile) {
      throw new Error(`Could not fetch event file: ${eventPath}`);
    }

    const eventData = JSON.parse(eventFile.content);
    if (!eventData.bouts) {
      eventData.bouts = [];
    }

    // Add bout ID if not already in the array
    if (!eventData.bouts.includes(bout.id)) {
      eventData.bouts.push(bout.id);
      // Sort bouts by order if we have the bout data
      eventData.bouts.sort();
    }

    console.log('Updating event with SHA:', eventFile.sha);
    console.log('Event bouts array:', eventData.bouts);

    try {
      await saveGitHubFile(
        eventPath,
        JSON.stringify(eventData, null, 2),
        `Add bout ${bout.id} to event ${bout.eventId}`,
        eventFile.sha
      );
      console.log('Event file updated successfully');
    } catch (shaError) {
      // If SHA error, retry once with fresh fetch
      console.error('SHA conflict error:', shaError);
      console.warn('Retrying with fresh fetch...');

      await new Promise(resolve => setTimeout(resolve, 1000));

      const freshEventFile = await getGitHubFile(eventPath);
      console.log('Fresh event file fetched:', freshEventFile ? 'SUCCESS' : 'NULL', freshEventFile ? `SHA: ${freshEventFile.sha}` : '');

      if (!freshEventFile) {
        throw new Error(`Could not fetch fresh event file: ${eventPath}`);
      }

      const freshEventData = JSON.parse(freshEventFile.content);
      if (!freshEventData.bouts) freshEventData.bouts = [];
      if (!freshEventData.bouts.includes(bout.id)) {
        freshEventData.bouts.push(bout.id);
        freshEventData.bouts.sort();
      }

      console.log('Retrying update with fresh SHA:', freshEventFile.sha);
      await saveGitHubFile(
        eventPath,
        JSON.stringify(freshEventData, null, 2),
        `Add bout ${bout.id} to event ${bout.eventId}`,
        freshEventFile.sha
      );
      console.log('Event file updated successfully on retry');
    }

    showMessage('bout-message', 'Bout added to fight card and event updated! Rebuilding site...');
    document.getElementById('bout-form').reset();

    // Add bout to local array immediately for instant display
    bouts.push(bout);

    // Update display immediately
    renderBouts();

    await loadEvents();

    // Trigger rebuild
    const rebuilt = await triggerRebuild();
    if (rebuilt) {
      showMessage('bout-message', 'Site rebuild triggered! Bout will be live in ~2-3 minutes.');
    }
  } catch (error) {
    console.error('Error adding bout:', error);
    showMessage('bout-message', 'Error adding bout: ' + error.message, true);
  }
});

function downloadBoutJSON(id) {
  const bout = bouts.find(b => b.id === id);
  if (bout) {
    downloadJSON(bout, `${id}.json`);
  }
}

// Delete bout
window.deleteBout = async function(boutId, eventId) {
  if (!confirm('Are you sure you want to delete this bout? This action cannot be undone.')) return;

  try {
    // Delete bout file from GitHub
    await deleteGitHubFile(`data/bouts/${boutId}.json`, `Delete bout: ${boutId}`);

    // Remove bout from event's bouts array
    const eventPath = `data/events/${eventId}.json`;
    const eventFile = await getGitHubFile(eventPath);

    if (eventFile) {
      const eventData = JSON.parse(eventFile.content);
      if (eventData.bouts) {
        eventData.bouts = eventData.bouts.filter(id => id !== boutId);

        await saveGitHubFile(
          eventPath,
          JSON.stringify(eventData, null, 2),
          `Remove bout ${boutId} from event ${eventId}`,
          eventFile.sha
        );
      }
    }

    // Remove bout from local array immediately
    bouts = bouts.filter(b => b.id !== boutId);

    // Update display
    renderBouts();

    showMessage('bout-message', 'Bout deleted successfully! Site will rebuild in ~2-3 minutes.');

    // Trigger rebuild
    await triggerRebuild();
  } catch (error) {
    console.error('Error deleting bout:', error);
    showMessage('bout-message', 'Error deleting bout: ' + error.message, true);
  }
};

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

document.getElementById('result-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const boutId = document.getElementById('result-bout').value;
  const method = document.getElementById('result-method').value;
  const winnerId = document.getElementById('result-winner').value;

  const bout = bouts.find(b => b.id === boutId);
  if (!bout) {
    showMessage('result-message', 'Bout not found', true);
    return;
  }

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
    showMessage('result-message', 'Submitting result and updating fighter records...');

    // Save result to GitHub
    const resultPath = `data/results/${boutId}.json`;
    await saveGitHubFile(
      resultPath,
      JSON.stringify(result, null, 2),
      `Add result for ${boutId}`
    );

    // Update fighter records
    await updateFighterRecords(bout, result);

    showMessage('result-message', 'Result saved! Fighter records updated. Rebuilding site...');

    document.getElementById('result-form').reset();
    document.getElementById('scorecard-section').classList.add('hidden');

    await loadResults();
    await loadFighters();

    // Trigger rebuild
    const rebuilt = await triggerRebuild();
    if (rebuilt) {
      showMessage('result-message', 'Site rebuild triggered! Changes will be live in ~2-3 minutes.');
    }
  } catch (error) {
    console.error('Error submitting result:', error);
    showMessage('result-message', 'Error submitting result: ' + error.message, true);
  }
});

// ===== UTILITIES =====

// Calculate ranking points based on result
function calculatePoints(result, isWinner, bout) {
  if (!isWinner) return 0;

  let points = 0;

  // Base points for winning
  points += 10;

  // Method bonus
  switch (result.method) {
    case 'KO':
      points += 5; // Knockout gets extra points
      break;
    case 'TKO':
      points += 4; // TKO gets good points
      break;
    case 'Submission':
      points += 4;
      break;
    case 'Decision':
      points += 2; // Decision gets fewer points
      break;
  }

  // Championship bonus
  if (bout.forChampionship) {
    points += 10;
  }

  // Performance bonus
  if (result.performanceBonus) {
    points += 5;
  }

  // Early finish bonus (finished before final round)
  if (result.round && result.round < bout.rounds) {
    points += 3;
  }

  return points;
}

// Update fighter records based on result
async function updateFighterRecords(bout, result) {
  const fighter1 = fighters.find(f => f.id === bout.fighter1Id);
  const fighter2 = fighters.find(f => f.id === bout.fighter2Id);

  if (!fighter1 || !fighter2) {
    throw new Error('Fighters not found');
  }

  // Determine winner and loser
  let winner, loser;
  const isDraw = !result.winnerId || result.winnerId === 'draw';

  if (!isDraw) {
    winner = result.winnerId === fighter1.id ? fighter1 : fighter2;
    loser = result.winnerId === fighter1.id ? fighter2 : fighter1;
  }

  // Update fighter 1
  const fighter1Updated = { ...fighter1 };
  if (!fighter1Updated.record) {
    fighter1Updated.record = { wins: 0, losses: 0, draws: 0 };
  }
  if (isDraw) {
    fighter1Updated.record.draws += 1;
  } else if (winner.id === fighter1.id) {
    fighter1Updated.record.wins += 1;
    fighter1Updated.rankingPoints = (fighter1Updated.rankingPoints || 0) + calculatePoints(result, true, bout);
  } else {
    fighter1Updated.record.losses += 1;
  }

  // Update fighter 2
  const fighter2Updated = { ...fighter2 };
  if (!fighter2Updated.record) {
    fighter2Updated.record = { wins: 0, losses: 0, draws: 0 };
  }
  if (isDraw) {
    fighter2Updated.record.draws += 1;
  } else if (winner.id === fighter2.id) {
    fighter2Updated.record.wins += 1;
    fighter2Updated.rankingPoints = (fighter2Updated.rankingPoints || 0) + calculatePoints(result, true, bout);
  } else {
    fighter2Updated.record.losses += 1;
  }

  // Save both fighters to GitHub
  try {
    const fighter1File = await getGitHubFile(`data/fighters/${fighter1.id}.json`);
    await saveGitHubFile(
      `data/fighters/${fighter1.id}.json`,
      JSON.stringify(fighter1Updated, null, 2),
      `Update ${fighter1.firstName} ${fighter1.lastName} record after ${bout.id}`,
      fighter1File?.sha
    );

    const fighter2File = await getGitHubFile(`data/fighters/${fighter2.id}.json`);
    await saveGitHubFile(
      `data/fighters/${fighter2.id}.json`,
      JSON.stringify(fighter2Updated, null, 2),
      `Update ${fighter2.firstName} ${fighter2.lastName} record after ${bout.id}`,
      fighter2File?.sha
    );
  } catch (error) {
    console.error('Error updating fighter records:', error);
    throw new Error('Failed to update fighter records: ' + error.message);
  }
}

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
