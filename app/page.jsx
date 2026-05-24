"use client";

import { useState } from "react";
import { ecsData } from "../lib/mock-api";

const navItems = [
  ["dashboard", "Главная"],
  ["tournaments", "Турниры"],
  ["leaderboard", "Таблица лидеров"],
  ["matches", "Матчи"],
  ["admin", "Админ"],
];

const guestPlayer = {
  id: 0,
  nick: "Гость",
  team: "Нет команды",
  level: 1,
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

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value).replaceAll(",", " ");
}

export default function HomePage() {
  const [game, setGame] = useState("cs2");
  const [view, setView] = useState("dashboard");
  const [selectedPlayerId, setSelectedPlayerId] = useState(1);
  const [registeredTournamentId, setRegisteredTournamentId] = useState(null);
  const [tournaments, setTournaments] = useState(ecsData.tournaments);
  const [bracket, setBracket] = useState(ecsData.bracket);

  const gameName = game === "cs2" ? "CS2" : "Fortnite";
  const player = ecsData.players.find((item) => item.id === selectedPlayerId) || ecsData.players[0] || guestPlayer;
  const gameTournaments = tournaments.filter((item) => item.game === gameName);
  const featuredTournament = gameTournaments[0];
  const leaderboardKey = game === "cs2" ? "cs2Rating" : "fortnitePoints";
  const leaderboard = [...ecsData.players].sort((a, b) => b[leaderboardKey] - a[leaderboardKey]);

  function register(tournamentId) {
    setRegisteredTournamentId(tournamentId);
  }

  function updateCode(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const tournamentId = Number(form.get("tournamentId"));
    const code = form.get("code").toString().trim();

    setTournaments((items) => items.map((item) => (item.id === tournamentId ? { ...item, code } : item)));
  }

  function updateMatch(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const matchId = Number(form.get("matchId"));
    const [scoreA, scoreB] = form
      .get("score")
      .toString()
      .split(":")
      .map((value) => Number(value.trim()));

    setBracket((items) =>
      items.map((item) =>
        item.id === matchId
          ? {
              ...item,
              teamA: form.get("teamA").toString().trim(),
              teamB: form.get("teamB").toString().trim(),
              scoreA: Number.isFinite(scoreA) ? scoreA : 0,
              scoreB: Number.isFinite(scoreB) ? scoreB : 0,
              status: form.get("status").toString(),
            }
          : item,
      ),
    );
    setView("matches");
  }

  function addTournament(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const tournamentGame = form.get("game").toString();

    setTournaments((items) => [
      {
        id: Date.now(),
        game: tournamentGame,
        name: form.get("name").toString(),
        mode: tournamentGame === "CS2" ? "2v2" : "Duos",
        date: form.get("date").toString(),
        slots: "0/32",
        prize: form.get("prize").toString(),
        code: form.get("code").toString(),
        status: "Открыт",
        image: tournamentGame === "CS2" ? "/assets/thumb-cs2-daily.png" : "/assets/thumb-fortnite-community.png",
      },
      ...items,
    ]);
    setView("tournaments");
  }

  return (
    <div className="app-shell" data-game={game}>
      <aside className="sidebar">
        <div className="brand">
          <img
            id="brandLogo"
            className="brand-logo"
            src={game === "cs2" ? "/assets/logo-gold.png" : "/assets/logo-purple.png"}
            alt="ECS Elite Cyber Squad"
          />
        </div>

        <nav className="side-nav" aria-label="Основная навигация">
          {navItems.map(([id, label]) => (
            <button key={id} className={`side-link ${view === id ? "active" : ""}`} onClick={() => setView(id)}>
              {label}
            </button>
          ))}
          <button className={`side-link ${game === "fortnite" ? "current-game" : ""}`} onClick={() => setGame("fortnite")}>
            Fortnite
          </button>
          <button className={`side-link ${game === "cs2" ? "current-game" : ""}`} onClick={() => setGame("cs2")}>
            CS2
          </button>
        </nav>

        <section className="season-card">
          <span>Сезон 1</span>
          <strong>24 дня</strong>
          <button onClick={() => setView("tournaments")}>Подробнее</button>
        </section>

        <section className="mini-profile">
          <img className="avatar" src="/assets/avatar-akkerman.png" alt="akkerman" />
          <div>
            <strong>{ecsData.user?.name || "Гость"}</strong>
            <span>Нет аккаунта</span>
          </div>
          <div className="xp-bar">
            <span />
          </div>
          <small>4820 / 7500 XP</small>
        </section>
      </aside>

      <main className="main">
        <header className="topbar">
          <nav className="top-nav" aria-label="Верхняя навигация">
            {navItems.slice(0, 5).map(([id, label]) => (
              <button key={id} className={`top-link ${view === id ? "active" : ""}`} onClick={() => setView(id)}>
                {label}
              </button>
            ))}
          </nav>

          <div className="top-actions">
            <button className="icon-button" aria-label="Уведомления">
              !
            </button>
            <button className="icon-button" aria-label="Сообщения">
              []
            </button>
            <button className="account-button">
              <img className="avatar small" src="/assets/avatar-akkerman.png" alt="akkerman" />
              <strong>{ecsData.user?.name || "Войти"}</strong>
            </button>
          </div>
        </header>

        {view === "dashboard" && (
          <section className="view active">
            <Hero game={game} register={() => register(featuredTournament.id)} />
            <StatStrip game={game} player={player} />

            <div className="dashboard-grid">
              <MyStats game={game} player={player} />
              <LeaderboardPreview game={game} leaderboard={leaderboard} onSelect={setSelectedPlayerId} openPlayers={() => setView("leaderboard")} />
              <FeaturedTournament game={game} tournament={featuredTournament} bracket={bracket} registeredTournamentId={registeredTournamentId} register={register} />
              <RecentMatches />
              <UpcomingTournaments tournaments={gameTournaments} register={register} />
              <CodePanel game={game} tournament={featuredTournament} registeredTournamentId={registeredTournamentId} register={register} />
            </div>
          </section>
        )}

        {view === "tournaments" && (
          <Page title="Турниры" eyebrow="ECS cups">
            <div className="mode-switch">
              <button className="mode-button" onClick={() => setGame("cs2")}>
                CS2
              </button>
              <button className="mode-button" onClick={() => setGame("fortnite")}>
                Fortnite
              </button>
            </div>
            <div className="tournament-grid">
              {gameTournaments.map((item) => (
                <TournamentCard key={item.id} tournament={item} register={register} />
              ))}
            </div>
          </Page>
        )}

        {view === "leaderboard" && (
          <Page title="Таблица лидеров" eyebrow="Season ranking">
            <div className="panel leaderboard-panel">
              {leaderboard.map((item, index) => (
                <button key={item.id} className="leader-row" onClick={() => setSelectedPlayerId(item.id)}>
                  <span className="leader-rank">#{index + 1}</span>
                  <span className="leader-main">
                    <strong>{item.nick}</strong>
                    <span className="leader-meta">ECS account</span>
                  </span>
                  <span className="leader-points">{formatNumber(item[leaderboardKey])}</span>
                  <span className="hide-mobile">{item.rank}</span>
                  <span className="pill hide-mobile">{game === "cs2" ? item.kd : item.pr}</span>
                </button>
              ))}
            </div>
          </Page>
        )}

        {view === "matches" && (
          <Page title="2v2 матчи" eyebrow="CS2 bracket">
            <BracketBoard bracket={bracket} />
          </Page>
        )}

        {view === "admin" && (
          <Page title="Админ-панель ECS" eyebrow="Control room">
            <AdminPanel tournaments={tournaments} bracket={bracket} addTournament={addTournament} updateCode={updateCode} updateMatch={updateMatch} />
          </Page>
        )}
      </main>
    </div>
  );
}

function Hero({ game, register }) {
  const isCs2 = game === "cs2";

  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="game-kicker">{isCs2 ? "CS2" : "FORTNITE"}</p>
        <h1>{isCs2 ? "Сражайся в 2v2 турнирах ECS" : "Участвуй в кастомках и набирай ECS points"}</h1>
        <p>{isCs2 ? "Побеждай дуэли, проходи сетку и становись лучшим составом Elite Cyber Squad." : "Выполняй условия, получай код острова, играй weekly cups и поднимайся в рейтинге."}</p>
        <button className="primary-action" onClick={register}>
          Играть сейчас
        </button>
      </div>
      <div className="hero-art" aria-hidden="true">
        <div className="energy-core" />
      </div>
    </section>
  );
}

function StatStrip({ game, player }) {
  const stats =
    game === "cs2"
      ? [["ECS Rating", player.cs2Rating], ["Победы", player.wins], ["Матчи", player.matches], ["K/D", player.kd], ["Win Rate", player.winRate], ["MVP", player.mvp]]
      : [["ECS Points", player.fortnitePoints], ["Победы", 12], ["Матчи", 48], ["Убийства", player.kills], ["Top-10", player.top10], ["K/D", "3.25"]];

  return (
    <section className="stat-strip">
      {stats.map(([label, value]) => (
        <article className="stat-card" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </section>
  );
}

function MyStats({ game, player }) {
  return (
    <section className="panel player-stat-panel">
      <div className="section-head">
        <h2>Моя статистика</h2>
        <select aria-label="Сезон">
          <option>Сезон 1</option>
        </select>
      </div>
      <div className="rank-block">
        <div className="rank-badge">ECS</div>
        <div>
          <span className="muted">RANK</span>
          <strong>{player.rank}</strong>
        </div>
        <div>
          <span className="muted">{game === "cs2" ? "ECS RATING" : "ECS POINTS"}</span>
          <strong>{formatNumber(game === "cs2" ? player.cs2Rating : player.fortnitePoints)}</strong>
        </div>
      </div>
      <div className="mini-stats">
        <div><span>Матчи</span><strong>{player.matches}</strong></div>
        <div><span>Победы</span><strong>{player.wins}</strong></div>
        <div><span>K/D</span><strong>{player.kd}</strong></div>
        <div><span>Win Rate</span><strong>{player.winRate}</strong></div>
        <div><span>MVP</span><strong>{player.mvp}</strong></div>
      </div>
      <div className="chart-line" aria-hidden="true" />
    </section>
  );
}

function LeaderboardPreview({ game, leaderboard, onSelect, openPlayers }) {
  const key = game === "cs2" ? "cs2Rating" : "fortnitePoints";

  return (
    <section className="panel">
      <div className="section-head">
        <h2>Лидерборд <span>{game === "cs2" ? "(CS2 2V2)" : "(FORTNITE)"}</span></h2>
        <button className="ghost-action" onClick={openPlayers}>Полный</button>
      </div>
      <div className="leader-list">
        {leaderboard.slice(0, 7).map((player, index) => (
          <button key={player.id} className="leader-row" onClick={() => onSelect(player.id)}>
            <span className="leader-rank">{index + 1}</span>
            <span className="leader-main">
              <strong>{game === "cs2" ? player.team : player.nick}</strong>
              <span className="leader-meta">{player.rank}</span>
            </span>
            <span className="leader-points">{formatNumber(player[key])}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function FeaturedTournament({ game, tournament, bracket, registeredTournamentId, register }) {
  return (
    <section className="panel tournament-panel">
      <div className="section-head">
        <h2>Текущий турнир</h2>
        <span className="live-pill">Идет</span>
      </div>
      <h3>{tournament.name}</h3>
      <p className="muted">{tournament.mode} / {tournament.slots} / {tournament.prize}</p>
      {game === "cs2" ? <BracketPreview bracket={bracket} /> : <TournamentCode tournament={tournament} registeredTournamentId={registeredTournamentId} register={register} />}
    </section>
  );
}

function BracketPreview({ bracket }) {
  const qf = bracket.filter((match) => match.round === "Quarter-finals").slice(0, 2);
  const sf = bracket.find((match) => match.round === "Semi-finals");
  const final = bracket.find((match) => match.round === "Final");

  return (
    <div className="bracket-preview">
      <div className="bracket-column">{qf.map((match) => <SmallMatch key={match.id} match={match} />)}</div>
      <div className="bracket-column">{sf && <SmallMatch match={sf} />}</div>
      <div className="winner-card">
        <strong>{final?.teamA}</strong>
        <span className="score-win">WINNER</span>
      </div>
    </div>
  );
}

function SmallMatch({ match }) {
  return (
    <div className="bracket-match">
      <div><strong>{match.teamA}</strong><span className="score-win">{match.scoreA || ""}</span></div>
      <div><strong>{match.teamB}</strong><span className="score-loss">{match.scoreB || ""}</span></div>
    </div>
  );
}

function RecentMatches() {
  return (
    <section className="panel">
      <div className="section-head"><h2>Последние матчи</h2></div>
      <div className="match-list">
        {ecsData.matches.map(([name, map, result, kd]) => {
          const won = result.startsWith("13");
          return (
            <div className="match-row" key={`${name}-${map}`}>
              <strong>{name}</strong>
              <span className="match-meta">{map}</span>
              <span className={won ? "result-win" : "result-loss"}>{result}</span>
              <span className="hide-mobile">{kd}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function UpcomingTournaments({ tournaments, register }) {
  return (
    <section className="panel upcoming-panel">
      <div className="section-head"><h2>Ближайшие турниры</h2></div>
      <div className="upcoming-list">
        {tournaments.map((tournament) => (
          <article className="upcoming-item" key={tournament.id}>
            <div className="thumb" style={{ backgroundImage: `url(${tournament.image})` }} />
            <div>
              <strong>{tournament.name}</strong>
              <div className="match-meta">{tournament.mode} / {tournament.slots}</div>
            </div>
            <div>
              <strong>{tournament.date.split(" ").slice(0, 2).join(" ")}</strong>
              <button className="secondary-action" onClick={() => register(tournament.id)}>Участвовать</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CodePanel({ game, tournament, registeredTournamentId, register }) {
  return (
    <section className="panel quick-panel">
      <div className="section-head"><h2>{game === "cs2" ? "Быстрые действия" : "Получить код острова"}</h2></div>
      {game === "cs2" ? (
        <>
          <div className="quick-action"><span className="pill">2v2</span><div><strong>Найти команду</strong><div className="match-meta">Найти тиммейта для турниров</div></div></div>
          <div className="quick-action"><span className="pill">+</span><div><strong>Создать команду</strong><div className="match-meta">Собери свою команду</div></div></div>
          <div className="quick-action"><span className="pill">?</span><div><strong>Правила турниров</strong><div className="match-meta">Ознакомься с правилами</div></div></div>
        </>
      ) : (
        <TournamentCode tournament={tournament} registeredTournamentId={registeredTournamentId} register={register} />
      )}
    </section>
  );
}

function TournamentCode({ tournament, registeredTournamentId, register }) {
  const isRegistered = registeredTournamentId === tournament.id;

  return (
    <>
      <div className="condition-row"><span>Аккаунт ECS</span><strong className="result-win">Проверено</strong></div>
      <div className="condition-row"><span>Подписка на Twitch</span><strong className="result-win">Проверено</strong></div>
      <div className="code-box">
        <span>КОД ОСТРОВА</span>
        <strong>{isRegistered ? tournament.code : "LOCKED"}</strong>
        <button className="secondary-action" onClick={() => register(tournament.id)}>{isRegistered ? "Код получен" : "Получить код"}</button>
      </div>
    </>
  );
}

function TournamentCard({ tournament, register }) {
  return (
    <article className="tournament-card">
      <div className="thumb" style={{ backgroundImage: `url(${tournament.image})` }} />
      <div className="card-meta">
        <span className="pill">{tournament.game}</span>
        <span className="pill">{tournament.status}</span>
      </div>
      <h3>{tournament.name}</h3>
      <p className="muted">{tournament.mode} / {tournament.slots} / {tournament.date}</p>
      <p className="muted">{tournament.prize}</p>
      <div className="card-actions">
        <button className="primary-action" onClick={() => register(tournament.id)}>Участвовать</button>
        <button className="secondary-action">Код</button>
      </div>
    </article>
  );
}

function BracketBoard({ bracket }) {
  return (
    <div className="bracket-board">
      {bracket.map((match) => (
        <article className="match-card" key={match.id}>
          <p className="eyebrow">{match.round}</p>
          <h3>Match {match.id}</h3>
          <div><strong>{match.teamA}</strong><span className="score-win">{match.scoreA || "TBD"}</span></div>
          <div><strong>{match.teamB}</strong><span className="score-loss">{match.scoreB || "TBD"}</span></div>
          <span className="pill">{match.status}</span>
        </article>
      ))}
    </div>
  );
}

function AdminPanel({ tournaments, bracket, addTournament, updateCode, updateMatch }) {
  return (
    <div className="admin-grid">
      <section className="panel">
        <div className="section-head"><h2>Создать турнир</h2></div>
        <form className="admin-form" onSubmit={addTournament}>
          <label>Название <input name="name" defaultValue="ECS 2v2 Night Cup #13" required /></label>
          <label>Игра <select name="game" defaultValue="CS2"><option>CS2</option><option>Fortnite</option></select></label>
          <label>Дата <input name="date" defaultValue="26 ДЕК 20:00" required /></label>
          <label>Приз <input name="prize" defaultValue="EUR 250 + ECS points" required /></label>
          <label>Код <input name="code" defaultValue="ECS-2V2-13" required /></label>
          <button className="primary-action" type="submit">Добавить турнир</button>
        </form>
      </section>

      <section className="panel">
        <div className="section-head"><h2>Код Fortnite / CS2</h2></div>
        <form className="admin-form" onSubmit={updateCode}>
          <label>Турнир <select name="tournamentId">{tournaments.map((item) => <option key={item.id} value={item.id}>{item.name} / {item.code}</option>)}</select></label>
          <label>Новый код <input name="code" defaultValue="7844-2231-1290" required /></label>
          <button className="primary-action" type="submit">Обновить код</button>
        </form>
      </section>

      <section className="panel">
        <div className="section-head"><h2>Редактировать 2v2 матч</h2></div>
        <form className="admin-form" onSubmit={updateMatch}>
          <label>Матч <select name="matchId">{bracket.map((item) => <option key={item.id} value={item.id}>Match {item.id} / {item.round}</option>)}</select></label>
          <label>Команда A <input name="teamA" defaultValue="akkerman & ghost" required /></label>
          <label>Команда B <input name="teamB" defaultValue="qwerty & d3m0n" required /></label>
          <label>Счет <input name="score" defaultValue="13 : 7" required /></label>
          <label>Статус <select name="status"><option>Scheduled</option><option>Live</option><option>Finished</option></select></label>
          <button className="primary-action" type="submit">Сохранить матч</button>
        </form>
      </section>
    </div>
  );
}

function Page({ title, eyebrow, children }) {
  return (
    <section className="view active">
      <div className="page-head">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
      </div>
      {children}
    </section>
  );
}
