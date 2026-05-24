const ADMIN_PASSWORD = "ECS2026";
const STORAGE_KEY = "ecs_site_mvp_state_v2";

const state = {
  game: "cs2",
  view: "dashboard",
  selectedPlayerId: null,
  registeredTournamentId: null,
  isAdmin: false,
  user: null,
  accounts: [],
  tournaments: [],
  players: [],
  matches: [],
  bracket: [],
};

const selectors = {
  shell: document.querySelector(".app-shell"),
  views: document.querySelectorAll(".view"),
  navButtons: document.querySelectorAll("[data-view]"),
  gameButtons: document.querySelectorAll("[data-game-switch]"),
  heroGame: document.querySelector("#heroGame"),
  heroTitle: document.querySelector("#heroTitle"),
  heroText: document.querySelector("#heroText"),
  brandLogo: document.querySelector("#brandLogo"),
  statStrip: document.querySelector("#statStrip"),
  myStats: document.querySelector("#myStats"),
  leaderList: document.querySelector("#leaderList"),
  leaderboardTitle: document.querySelector("#leaderboardTitle"),
  featuredTournament: document.querySelector("#featuredTournament"),
  recentMatches: document.querySelector("#recentMatches"),
  upcomingList: document.querySelector("#upcomingList"),
  codePanel: document.querySelector("#codePanel"),
  codePanelTitle: document.querySelector("#codePanelTitle"),
  tournamentGrid: document.querySelector("#tournamentGrid"),
  leaderboardTable: document.querySelector("#leaderboardTable"),
  bracketBoard: document.querySelector("#bracketBoard"),
  adminForm: document.querySelector("#adminForm"),
  codeForm: document.querySelector("#codeForm"),
  bracketForm: document.querySelector("#bracketForm"),
  statsForm: document.querySelector("#statsForm"),
  adminLoginForm: document.querySelector("#adminLoginForm"),
  adminLock: document.querySelector("#adminLock"),
  adminContent: document.querySelector("#adminContent"),
  codeTournamentSelect: document.querySelector("#codeTournamentSelect"),
  matchSelect: document.querySelector("#matchSelect"),
  adminTournamentList: document.querySelector("#adminTournamentList"),
  authButton: document.querySelector("#authButton"),
  authModal: document.querySelector("#authModal"),
  closeAuth: document.querySelector("#closeAuth"),
  accountForm: document.querySelector("#accountForm"),
  miniProfileName: document.querySelector("#miniProfileName"),
  miniProfileLevel: document.querySelector("#miniProfileLevel"),
  miniProfileXp: document.querySelector("#miniProfileXp"),
  accountName: document.querySelector("#accountName"),
  toast: document.querySelector("#toast"),
};

const guestPlayer = {
  id: 0,
  nick: "Гость",
  team: "Нет команды",
  epic: "",
  steam: "",
  level: 1,
  xp: 0,
  cs2Rating: 0,
  fortnitePoints: 0,
  rank: "UNRANKED",
  matches: 0,
  wins: 0,
  kd: 0,
  winRate: "0%",
  mvp: 0,
  kills: 0,
  top10: 0,
  pr: 0,
  placements: 0,
  earnings: "$0",
};

function activeGameName() {
  return state.game === "cs2" ? "CS2" : "Fortnite";
}

function saveLocalState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      user: state.user,
      accounts: state.accounts,
      selectedPlayerId: state.selectedPlayerId,
      registeredTournamentId: state.registeredTournamentId,
      players: state.players,
      tournaments: state.tournaments,
      bracket: state.bracket,
    }),
  );
}

function loadLocalState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function createZeroPlayer({ nick }) {
  const safeNick = nick.trim() || "player";
  return {
    ...guestPlayer,
    id: Date.now(),
    nick: safeNick,
    team: `${safeNick} & teammate`,
  };
}

function currentPlayer() {
  if (state.selectedPlayerId) {
    const selected = state.players.find((player) => player.id === state.selectedPlayerId);
    if (selected) return selected;
  }

  if (state.user) {
    const own = state.players.find((player) => player.id === state.user.playerId);
    if (own) return own;
  }

  return guestPlayer;
}

function gameTournaments() {
  return state.tournaments.filter((tournament) => tournament.game === activeGameName() && tournament.status !== "Скрыт");
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0).replaceAll(",", " ");
}

function setView(view) {
  if (view === "players") view = "leaderboard";
  state.view = view;
  selectors.views.forEach((node) => node.classList.toggle("active", node.id === view));
  selectors.navButtons.forEach((node) => node.classList.toggle("active", node.dataset.view === view));
  renderAdminGate();
}

function setGame(game) {
  state.game = game;
  selectors.shell.dataset.game = game;
  selectors.brandLogo.src = game === "cs2" ? "assets/logo-gold.png" : "assets/logo-purple.png";
  selectors.gameButtons.forEach((node) => {
    node.classList.toggle("current-game", node.dataset.gameSwitch === game);
  });
  renderAll();
}

function toast(message) {
  selectors.toast.textContent = message;
  selectors.toast.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => selectors.toast.classList.remove("show"), 2400);
}

function openAuthModal() {
  selectors.authModal.classList.remove("hidden");
}

function closeAuthModal() {
  selectors.authModal.classList.add("hidden");
}

function loginOrRegisterAccount({ nick, password }) {
  const normalizedNick = nick.trim();
  const normalizedPassword = password.trim();
  if (!normalizedNick || normalizedPassword.length < 4) {
    toast("Введите ник и пароль минимум 4 символа.");
    return;
  }

  let account = state.accounts.find((item) => item.nick.toLowerCase() === normalizedNick.toLowerCase());
  if (account && account.password !== normalizedPassword) {
    toast("Неверный пароль для этого ника.");
    return;
  }

  let player = state.players.find((item) => item.nick.toLowerCase() === normalizedNick.toLowerCase());
  if (!player) {
    player = createZeroPlayer({ nick: normalizedNick });
    state.players.push(player);
  }

  if (!account) {
    account = {
      id: Date.now() + 1,
      nick: normalizedNick,
      password: normalizedPassword,
      playerId: player.id,
      createdAt: new Date().toISOString(),
    };
    state.accounts.push(account);
  }

  state.user = {
    playerId: player.id,
    name: player.nick,
    accountId: account.id,
  };
  state.selectedPlayerId = player.id;
  saveLocalState();
  closeAuthModal();
  renderAll();
  toast(`Готово, ${player.nick}. Аккаунт активен.`);
}

function ensureAuth() {
  if (state.user) return true;
  openAuthModal();
  toast("Сначала войди или зарегистрируйся.");
  return false;
}

function renderUser() {
  const player = currentPlayer();
  selectors.miniProfileName.textContent = state.user ? player.nick : "Гость";
  selectors.miniProfileLevel.textContent = state.user ? `Уровень ${player.level}` : "Нет аккаунта";
  selectors.miniProfileXp.textContent = `${player.xp || 0} / 7500 XP`;
  selectors.accountName.textContent = state.user ? player.nick : "Войти";
}

function renderHero() {
  const isCs2 = state.game === "cs2";
  selectors.heroGame.textContent = isCs2 ? "CS2" : "FORTNITE";
  selectors.heroTitle.textContent = isCs2
    ? "Сражайся в 2v2 турнирах ECS"
    : "Участвуй в кастомках и набирай ECS points";
  selectors.heroText.textContent = isCs2
    ? "Побеждай дуэли, проходи сетку и становись лучшим составом Elite Cyber Squad."
    : "Зарегистрируйся на сайте, получай код кастомки и поднимай рейтинг ECS.";
}

function renderStatStrip() {
  const player = currentPlayer();
  const stats =
    state.game === "cs2"
      ? [
          ["ECS Rating", player.cs2Rating],
          ["Победы", player.wins],
          ["Матчи", player.matches],
          ["K/D", player.kd],
          ["Win Rate", player.winRate],
          ["MVP", player.mvp],
        ]
      : [
          ["ECS Points", player.fortnitePoints],
          ["Победы", player.wins],
          ["Матчи", player.matches],
          ["Убийства", player.kills],
          ["Top-10", player.top10],
          ["K/D", player.kd],
        ];

  selectors.statStrip.innerHTML = stats
    .map(
      ([label, value]) => `
        <article class="stat-card">
          <span>${label}</span>
          <strong>${value}</strong>
        </article>
      `,
    )
    .join("");
}

function renderMyStats() {
  const player = currentPlayer();
  selectors.myStats.innerHTML = `
    <div class="rank-block">
      <div class="rank-badge">ECS</div>
      <div>
        <span class="muted">RANK</span>
        <strong>${player.rank}</strong>
      </div>
      <div>
        <span class="muted">${state.game === "cs2" ? "ECS RATING" : "ECS POINTS"}</span>
        <strong>${formatNumber(state.game === "cs2" ? player.cs2Rating : player.fortnitePoints)}</strong>
      </div>
    </div>
    <div class="mini-stats">
      <div><span>Матчи</span><strong>${player.matches}</strong></div>
      <div><span>Победы</span><strong>${player.wins}</strong></div>
      <div><span>K/D</span><strong>${player.kd}</strong></div>
      <div><span>Win Rate</span><strong>${player.winRate}</strong></div>
      <div><span>MVP</span><strong>${player.mvp}</strong></div>
    </div>
    <div class="chart-line" aria-hidden="true"></div>
  `;
}

function leaderboardPlayers() {
  return [...state.players].sort((a, b) => {
    const key = state.game === "cs2" ? "cs2Rating" : "fortnitePoints";
    return b[key] - a[key];
  });
}

function renderLeaders() {
  selectors.leaderboardTitle.textContent = state.game === "cs2" ? "(CS2 2V2)" : "(FORTNITE)";
  const key = state.game === "cs2" ? "cs2Rating" : "fortnitePoints";
  const players = leaderboardPlayers();
  const emptyState = `<p class="muted">Пока нет игроков. Зарегистрируй аккаунт или добавь статистику в админке.</p>`;

  selectors.leaderList.innerHTML = players.length
    ? players
        .slice(0, 7)
        .map(
          (player, index) => `
            <button class="leader-row" data-player="${player.id}">
              <span class="leader-rank">${index + 1}</span>
              <span class="leader-main"><strong>${state.game === "cs2" ? player.team : player.nick}</strong><span class="leader-meta">${player.rank}</span></span>
              <span class="leader-points">${formatNumber(player[key])}</span>
            </button>
          `,
        )
        .join("")
    : emptyState;

  selectors.leaderboardTable.innerHTML = players.length
    ? players
        .map(
          (player, index) => `
            <button class="leader-row" data-player="${player.id}">
              <span class="leader-rank">#${index + 1}</span>
              <span class="leader-main"><strong>${player.nick}</strong><span class="leader-meta">ECS account</span></span>
              <span class="leader-points">${formatNumber(player[key])}</span>
              <span class="hide-mobile">${player.rank}</span>
              <span class="pill hide-mobile">${state.game === "cs2" ? player.kd : player.pr}</span>
            </button>
          `,
        )
        .join("")
    : emptyState;
}

function renderFeaturedTournament() {
  const tournament = gameTournaments()[0];
  if (!tournament) {
    selectors.featuredTournament.innerHTML = `<p class="muted">Пока нет опубликованных турниров.</p>`;
    return;
  }

  selectors.featuredTournament.innerHTML = `
    <h3>${tournament.name}</h3>
    <p class="muted">${tournament.mode} / ${tournament.slots} / ${tournament.prize}</p>
    ${state.game === "cs2" ? renderBracketPreview() : renderCodePanelMarkup(tournament)}
  `;
}

function renderBracketPreview() {
  const qf = state.bracket.filter((match) => match.round === "Quarter-finals").slice(0, 2);
  const sf = state.bracket.find((match) => match.round === "Semi-finals");
  const final = state.bracket.find((match) => match.round === "Final");

  return `
    <div class="bracket-preview">
      <div class="bracket-column">${qf.map(renderSmallMatch).join("")}</div>
      <div class="bracket-column">${sf ? renderSmallMatch(sf) : ""}</div>
      <div class="winner-card">
        <strong>${final?.teamA || "TBD"}</strong>
        <span class="score-win">WINNER</span>
      </div>
    </div>
  `;
}

function renderSmallMatch(match) {
  return `
    <div class="bracket-match">
      <div><strong>${match.teamA}</strong><span class="score-win">${match.scoreA || ""}</span></div>
      <div><strong>${match.teamB}</strong><span class="score-loss">${match.scoreB || ""}</span></div>
    </div>
  `;
}

function renderRecentMatches() {
  selectors.recentMatches.innerHTML = state.matches
    .map(([name, map, result, kd]) => {
      const won = result.startsWith("13");
      return `
        <div class="match-row">
          <strong>${name}</strong>
          <span class="match-meta">${map}</span>
          <span class="${won ? "result-win" : "result-loss"}">${result}</span>
          <span class="hide-mobile">${kd}</span>
        </div>
      `;
    })
    .join("");
}

function renderUpcoming() {
  const tournaments = gameTournaments();
  selectors.upcomingList.innerHTML = tournaments.length
    ? tournaments
        .map(
          (tournament) => `
            <article class="upcoming-item">
              <div class="thumb" style="background-image: url('${tournament.image}')"></div>
              <div>
                <strong>${tournament.name}</strong>
                <div class="match-meta">${tournament.mode} / ${tournament.slots}</div>
              </div>
              <div>
                <strong>${tournament.date.split(" ").slice(0, 2).join(" ")}</strong>
                <button class="secondary-action" data-register="${tournament.id}">Участвовать</button>
              </div>
            </article>
          `,
        )
        .join("")
    : `<p class="muted">Пока нет опубликованных турниров для ${activeGameName()}.</p>`;
}

function renderCodePanelMarkup(tournament) {
  const isRegistered = state.registeredTournamentId === tournament.id;
  const hasUser = Boolean(state.user);
  return `
    <div class="condition-row"><span>Аккаунт ECS</span><strong class="${hasUser ? "result-win" : "result-loss"}">${hasUser ? "Есть" : "Нужен"}</strong></div>
    <div class="condition-row"><span>Статистика ECS</span><strong class="result-win">0 по умолчанию</strong></div>
    <div class="code-box">
      <span>${state.game === "cs2" ? "КОД КОМНАТЫ" : "КОД ОСТРОВА"}</span>
      <strong>${isRegistered && hasUser ? tournament.code : "LOCKED"}</strong>
      <button class="secondary-action" data-register="${tournament.id}">
        ${isRegistered && hasUser ? "Код получен" : "Получить код"}
      </button>
    </div>
  `;
}

function renderCodePanel() {
  const tournament = gameTournaments()[0];
  selectors.codePanelTitle.textContent = state.game === "cs2" ? "Быстрые действия" : "Получить код острова";
  if (!tournament) {
    selectors.codePanel.innerHTML = `<p class="muted">Сначала опубликуй турнир в админке.</p>`;
    return;
  }

  selectors.codePanel.innerHTML =
    state.game === "cs2"
      ? `
        <div class="quick-action"><span class="pill">ECS</span><div><strong>Аккаунт</strong><div class="match-meta">${state.user ? state.user.name : "Войди на сайт"}</div></div></div>
        <div class="quick-action"><span class="pill">2v2</span><div><strong>Найти команду</strong><div class="match-meta">Скоро: подбор тиммейта</div></div></div>
        <div class="quick-action"><span class="pill">Код</span><div><strong>${state.registeredTournamentId === tournament.id && state.user ? tournament.code : "LOCKED"}</strong><div class="match-meta">Код после регистрации</div></div></div>
      `
      : renderCodePanelMarkup(tournament);
}

function renderTournaments() {
  const tournaments = gameTournaments();
  selectors.tournamentGrid.innerHTML = tournaments.length
    ? tournaments
        .map(
          (tournament) => `
            <article class="tournament-card">
              <div class="thumb" style="background-image: url('${tournament.image}')"></div>
              <div class="card-meta">
                <span class="pill">${tournament.game}</span>
                <span class="pill">${tournament.status}</span>
              </div>
              <h3>${tournament.name}</h3>
              <p class="muted">${tournament.mode} / ${tournament.slots} / ${tournament.date}</p>
              <p class="muted">${tournament.prize}</p>
              <div class="card-actions">
                <button class="primary-action" data-register="${tournament.id}">Участвовать</button>
                <button class="secondary-action" data-code="${tournament.id}">Код</button>
                ${state.isAdmin ? `<button class="secondary-action danger-action" data-delete-tournament="${tournament.id}">Удалить</button>` : ""}
              </div>
            </article>
          `,
        )
        .join("")
    : `<p class="muted">Пока нет опубликованных турниров.</p>`;
}

function renderBracket() {
  selectors.bracketBoard.innerHTML = state.bracket
    .map(
      (match) => `
        <article class="match-card">
          <p class="eyebrow">${match.round}</p>
          <h3>Match ${match.id}</h3>
          <div><strong>${match.teamA}</strong><span class="score-win">${match.scoreA || "TBD"}</span></div>
          <div><strong>${match.teamB}</strong><span class="score-loss">${match.scoreB || "TBD"}</span></div>
          <span class="pill">${match.status}</span>
        </article>
      `,
    )
    .join("");
}

function renderAdminSelects() {
  selectors.codeTournamentSelect.innerHTML = state.tournaments
    .map((tournament) => `<option value="${tournament.id}">${tournament.name} / ${tournament.code}</option>`)
    .join("");
  selectors.matchSelect.innerHTML = state.bracket
    .map((match) => `<option value="${match.id}">Match ${match.id} / ${match.round}</option>`)
    .join("");
  selectors.adminTournamentList.innerHTML = state.tournaments.length
    ? state.tournaments
        .map(
          (tournament) => `
            <div class="admin-list-row">
              <div>
                <strong>${tournament.name}</strong>
                <div class="match-meta">${tournament.game} / ${tournament.status} / ${tournament.date}</div>
              </div>
              <button class="secondary-action danger-action" data-delete-tournament="${tournament.id}">Удалить</button>
            </div>
          `,
        )
        .join("")
    : `<p class="muted">Турниров пока нет.</p>`;
}

function renderAdminGate() {
  if (!selectors.adminLock || !selectors.adminContent) return;
  selectors.adminLock.classList.toggle("hidden", state.isAdmin);
  selectors.adminContent.classList.toggle("hidden", !state.isAdmin);
}

function registerForTournament(id) {
  if (!ensureAuth()) return;
  const tournament = state.tournaments.find((item) => item.id === id);
  if (!tournament) return;
  state.registeredTournamentId = id;
  saveLocalState();
  renderAll();
  toast(`Вы участвуете: ${tournament.name}. Код открыт.`);
}

function upsertPlayerStats(form) {
  const nick = form.get("nick").toString().trim();
  if (!nick) return;

  let player = state.players.find((item) => item.nick.toLowerCase() === nick.toLowerCase());
  if (!player) {
    player = createZeroPlayer({ nick });
    state.players.push(player);
  }

  player.cs2Rating = Number(form.get("cs2Rating")) || 0;
  player.fortnitePoints = Number(form.get("fortnitePoints")) || 0;
  player.matches = Number(form.get("matches")) || 0;
  player.wins = Number(form.get("wins")) || 0;
  player.kd = Number(form.get("kd")) || 0;
  player.mvp = Number(form.get("mvp")) || 0;
  player.rank = player.cs2Rating > 0 || player.fortnitePoints > 0 ? "ECS" : "UNRANKED";
  player.winRate = player.matches ? `${Math.round((player.wins / player.matches) * 100)}%` : "0%";

  saveLocalState();
  renderAll();
  toast(`Статистика для ${player.nick} сохранена.`);
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-view]");
    const gameButton = event.target.closest("[data-game-switch]");
    const registerButton = event.target.closest("[data-register]");
    const codeButton = event.target.closest("[data-code]");
    const playerButton = event.target.closest("[data-player]");
    const deleteTournamentButton = event.target.closest("[data-delete-tournament]");

    if (viewButton) setView(viewButton.dataset.view);
    if (gameButton) setGame(gameButton.dataset.gameSwitch);
    if (registerButton) registerForTournament(Number(registerButton.dataset.register));
    if (codeButton) {
      if (!ensureAuth()) return;
      const tournament = state.tournaments.find((item) => item.id === Number(codeButton.dataset.code));
      toast(state.registeredTournamentId === tournament.id ? `Код: ${tournament.code}` : "Сначала зарегистрируйся на турнир.");
    }
    if (deleteTournamentButton) {
      if (!state.isAdmin) return;
      const tournamentId = Number(deleteTournamentButton.dataset.deleteTournament);
      state.tournaments = state.tournaments.filter((item) => item.id !== tournamentId);
      if (state.registeredTournamentId === tournamentId) state.registeredTournamentId = null;
      saveLocalState();
      renderAll();
      toast("Турнир удалён.");
    }
    if (playerButton) {
      state.selectedPlayerId = Number(playerButton.dataset.player);
      renderAll();
    }
  });

  document.querySelector("#quickJoin").addEventListener("click", () => {
    const tournament = gameTournaments()[0];
    if (tournament) registerForTournament(tournament.id);
  });

  selectors.authButton.addEventListener("click", openAuthModal);
  selectors.closeAuth.addEventListener("click", closeAuthModal);

  selectors.accountForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(selectors.accountForm);
    loginOrRegisterAccount({
      nick: form.get("nick").toString(),
      password: form.get("password").toString(),
    });
  });

  selectors.adminLoginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(selectors.adminLoginForm);
    state.isAdmin = form.get("password") === ADMIN_PASSWORD;
    renderAdminGate();
    toast(state.isAdmin ? "Админка открыта." : "Неверный пароль.");
  });

  selectors.adminForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.isAdmin) return;
    const form = new FormData(selectors.adminForm);
    const createdGame = form.get("game").toString();
    state.tournaments.unshift({
      id: Date.now(),
      game: createdGame,
      name: form.get("name"),
      mode: createdGame === "CS2" ? "2v2" : "Duos",
      date: form.get("date"),
      slots: "0/32",
      prize: form.get("prize"),
      code: form.get("code"),
      status: form.get("status"),
      image: createdGame === "CS2" ? "assets/thumb-cs2-daily.png" : "assets/thumb-fortnite-community.png",
    });
    saveLocalState();
    setGame(createdGame === "CS2" ? "cs2" : "fortnite");
    setView("tournaments");
    toast("Турнир опубликован.");
  });

  selectors.codeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.isAdmin) return;
    const form = new FormData(selectors.codeForm);
    const tournament = state.tournaments.find((item) => item.id === Number(form.get("tournamentId")));
    if (!tournament) return;
    tournament.code = form.get("code").toString().trim();
    saveLocalState();
    renderAll();
    toast(`Код обновлен: ${tournament.code}`);
  });

  selectors.statsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.isAdmin) return;
    upsertPlayerStats(new FormData(selectors.statsForm));
  });

  selectors.bracketForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.isAdmin) return;
    const form = new FormData(selectors.bracketForm);
    const match = state.bracket.find((item) => item.id === Number(form.get("matchId")));
    if (!match) return;
    const [scoreA, scoreB] = form.get("score").toString().split(":").map((value) => Number(value.trim()));
    match.teamA = form.get("teamA").toString().trim();
    match.teamB = form.get("teamB").toString().trim();
    match.scoreA = Number.isFinite(scoreA) ? scoreA : 0;
    match.scoreB = Number.isFinite(scoreB) ? scoreB : 0;
    match.status = form.get("status");
    saveLocalState();
    renderAll();
    setView("matches");
    toast(`Match ${match.id} обновлен.`);
  });
}

function renderAll() {
  renderUser();
  renderHero();
  renderStatStrip();
  renderMyStats();
  renderLeaders();
  renderFeaturedTournament();
  renderRecentMatches();
  renderUpcoming();
  renderCodePanel();
  renderTournaments();
  renderBracket();
  renderAdminSelects();
  renderAdminGate();
}

function boot() {
  const initialData = window.ecsApi.getInitialData();
  const localData = loadLocalState();
  state.user = localData.user || initialData.user;
  state.accounts = localData.accounts || [];
  state.tournaments = localData.tournaments || initialData.tournaments;
  state.players = localData.players || initialData.players;
  state.matches = initialData.matches;
  state.bracket = localData.bracket || initialData.bracket;
  state.registeredTournamentId = localData.registeredTournamentId || null;
  state.selectedPlayerId = localData.selectedPlayerId || state.user?.playerId || null;
  bindEvents();

  renderAll();
}

boot();
