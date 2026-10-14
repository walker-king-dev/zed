// ----------- Constants -----------
// The five stats we collect for each team, in form order.
const STATS = [
    { key: 'pts',  label: 'Points' },
  { key: 'fga',  label: 'Field goal attempts' },
  { key: 'oreb', label: 'Offensive rebounds' },
  { key: 'tov',  label: 'Turnovers' },
  { key: 'fta',  label: 'Free throw attempts' }
];

// prefix matches the ids in the HTML
const SIDES = [
    {prefix: 'team', name: 'Your team'},
    {prefix: 'opp', name: 'Opponent'}
];

// Math
function estimatePossessions(fga, oreb, tov, fta) {
  return fga - oreb + tov + 0.44 * fta;
}

// Points scored per 100 possessions. Used for both offensive rating
// (your points / your possessions) and defensive rating
// (opponent's points / opponent's possessions)
function pointsPer100(points, possessions) {
    return 100 * points / possessions;
}

// Takes two validated stat objects and returns every calculated result.
// It never touches the page, so it's easy to test and resuse.
function calculateGame(team, opp) {
    const teamPoss = estimatePossessions(team.fga, team.oreb, team.tov, team.fta);
    const oppPoss = estimatePossessions(opp.fga, opp.oreb, opp.tov, opp.fta);

    const ortg = pointsPer100(team.pts, teamPoss);
    const drtg = pointsPer100(opp.pts, oppPoss);

  return {
    teamPoss: teamPoss,
    oppPoss: oppPoss,
    ortg: ortg,
    drtg: drtg,
    net: ortg - drtg,
    pace: (teamPoss + oppPoss) / 2  // average of both teams, per game
  };
}

// ---------- Reading and validating ----------
// Read one team's fields as raw text (NOT converted yet), so we can
// tell the difference between a blank field and a real 0.
function readRawTeam(prefix) {
  const raw = {};
  for (const stat of STATS) {
    raw[stat.key] = document.getElementById(prefix + '-' + stat.key).value.trim();
  }
  return raw;
}

// Check one team's raw values. Returns a list of problems, each with
// the id of the field to highlight and a message that says how to fix it.
function validateTeam(side, raw) {
  const errors = [];

  for (const stat of STATS) {
    const id = side.prefix + '-' + stat.key;
    const text = raw[stat.key];
    const where = side.name + ' - ' + stat.label;

    if (text === '') {
      errors.push({ id, message: where + ' is empty or not a number. Enter a whole number, 0 or higher.' });
    } else if (!Number.isInteger(Number(text)) || Number(text) < 0) {
      errors.push({ id, message: where + ' must be a whole number, 0 or higher.' });
    }
  }

  // Cross-field check: only runs if both numbers were valid on their own.
  const fgaOk = !errors.some(e => e.id === side.prefix + '-fga');
  const orebOk = !errors.some(e => e.id === side.prefix + '-oreb');
  if (fgaOk && orebOk && Number(raw.oreb) > Number(raw.fga)) {
    errors.push({
      id: side.prefix + '-oreb',
      message: side.name + ' - Offensive rebounds can\'t be more than field goal attempts. Lower OREB or check FGA.'
    });
  }

  return errors;
}

// Convert already-validated raw text into real numbers.
function toNumbers(raw) {
  const nums = {};
  for (const stat of STATS) {
    nums[stat.key] = Number(raw[stat.key]);
  }
  return nums;
}

// ---------- Showing and clearing errors ----------
const errorArea = document.getElementById('error-area');

function clearErrors() {
  errorArea.textContent = '';
  document.querySelectorAll('input[aria-invalid]').forEach(function (input) {
    input.removeAttribute('aria-invalid');
  });
}

function showErrors(errors) {
  clearErrors();

  const heading = document.createElement('p');
  heading.textContent = errors.length === 1
    ? 'Fix 1 problem to continue:'
    : 'Fix ' + errors.length + ' problems to continue:';

  const list = document.createElement('ul');
  for (const error of errors) {
    const item = document.createElement('li');
    item.textContent = error.message;
    list.appendChild(item);
    document.getElementById(error.id).setAttribute('aria-invalid', 'true');
  }

  errorArea.appendChild(heading);
  errorArea.appendChild(list);

  // Move keyboard focus to the first problem field.
  document.getElementById(errors[0].id).focus();
}

// ---------- Showing results ----------
const resultsArea = document.getElementById('results');

// Put a "+" in front of positive numbers: 4.0 becomes "+4.0".
function formatSigned(n) {
  const text = n.toFixed(1);
  return n > 0 ? '+' + text : text;
}

// Add one term/definition pair (label, big number, plain-words explanation).
function addResult(list, label, value, explanation) {
  const term = document.createElement('dt');
  term.textContent = label;

  const detail = document.createElement('dd');
  const big = document.createElement('div');
  big.className = 'value';
  big.textContent = value;
  const note = document.createElement('div');
  note.className = 'explain';
  note.textContent = explanation;
  detail.appendChild(big);
  detail.appendChild(note);

  list.appendChild(term);
  list.appendChild(detail);
}

function clearResults() {
  resultsArea.textContent = '';
}

function renderResults(game) {
  clearResults();

  const heading = document.createElement('h2');
  heading.textContent = 'Results';

  // A sentence, so the result never depends on color or a sign alone.
  const verdict = document.createElement('p');
  verdict.className = 'verdict';
  const margin = Math.abs(game.net).toFixed(1);
  if (game.net > 0) {
    verdict.textContent = 'Your team was ' + margin + ' points better per 100 possessions.';
  } else if (game.net < 0) {
    verdict.textContent = 'Your team was ' + margin + ' points worse per 100 possessions.';
  } else {
    verdict.textContent = 'Both teams were equally efficient per 100 possessions.';
  }

  const list = document.createElement('dl');
  addResult(list, 'Your possessions', game.teamPoss.toFixed(1),
    'About how many times your team had the ball.');
  addResult(list, 'Opponent possessions', game.oppPoss.toFixed(1),
    'About how many times the opponent had the ball.');
  addResult(list, 'Offensive rating', game.ortg.toFixed(1),
    'Points your team scored per 100 possessions.');
  addResult(list, 'Defensive rating', game.drtg.toFixed(1),
    'Points your team allowed per 100 possessions. Lower is better.');
  addResult(list, 'Net rating', formatSigned(game.net),
    'Offensive rating minus defensive rating. Above 0 means you outplayed them.');
  addResult(list, 'Pace', game.pace.toFixed(1),
    'Average possessions per team in this game.');

  resultsArea.appendChild(heading);
  resultsArea.appendChild(verdict);
  resultsArea.appendChild(list);
}

// ---------- Form handling ----------
const form = document.getElementById('game-form');

form.addEventListener('submit', function (event) {
  event.preventDefault();
  clearErrors();
  clearResults();

  const raw = {};
  let errors = [];
  for (const side of SIDES) {
    raw[side.prefix] = readRawTeam(side.prefix);
    errors = errors.concat(validateTeam(side, raw[side.prefix]));
  }

  if (errors.length > 0) {
    showErrors(errors);
    return; // stop here: don't calculate with bad data
  }

  const team = toNumbers(raw.team);
  const opp = toNumbers(raw.opp);

  const teamPoss = estimatePossessions(team.fga, team.oreb, team.tov, team.fta);
  const oppPoss = estimatePossessions(opp.fga, opp.oreb, opp.tov, opp.fta);

  // Zero (or negative) possessions would cause divide-by-zero later.
  if (teamPoss <= 0 || oppPoss <= 0) {
    const problems = [];
    if (teamPoss <= 0) problems.push({ id: 'team-fga', message: 'Your team has 0 possessions. Check FGA, OREB, TOV, and FTA.' });
    if (oppPoss <= 0) problems.push({ id: 'opp-fga', message: 'Opponent has 0 possessions. Check FGA, OREB, TOV, and FTA.' });
    showErrors(problems);
    return;
  }

  renderResults(calculateGame(team, opp));
});