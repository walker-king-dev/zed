// Estimate how many possessions a team used in a game.
// Formula: FGA - OREB + TOV + 0.44 * FTA
// The 0.44 is an estimate of how many free throw attempts end a possession.
function estimatePossessions(fga, oreb, tov, fta) {
    return fga - oreb + tov + 0.44 * fta;
}

// Read the five numbers for one team from the form.
// prefix is "team" or "opp", matching the ids in the HTML.
function readTeam(prefix) {
    return {
        pts: Number(document.getElementById(prefix + '-pts').value),
        fga: Number(document.getElementById(prefix + '-fga').value),
        oreb: Number(document.getElementById(prefix + '-oreb').value),
        tov: Number(document.getElementById(prefix + '-tov').value),
        fta: Number(document.getElementById(prefix + '-fta').value)
    };
}

// Temporary: log possessions to the console when the form is submitted.
const form = document.getElementById('game-form');

form.addEventListener('submit', function (event) {
    event.preventDefault(); // stop the page from reloading

    const team = readTeam('team');
    const opp = readTeam('opp');

    const teamPoss = estimatePossessions(team.fga, team.oreb, team.tov, team.fta);
    const oppPoss = estimatePossessions(opp.fga, opp.oreb, opp.tov, opp.fta);

    console.log('Your team possessions:', teamPoss.toFixed(2));
    console.log('Opponent possessions:', oppPoss.toFixed(2));
});