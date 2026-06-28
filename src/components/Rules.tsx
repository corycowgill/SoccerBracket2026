import PanelHeader from "./PanelHeader";

export default function Rules() {
  return (
    <div className="space-y-4 max-w-3xl">
      <PanelHeader icon="📖" title="How the World Cup 2026 works 🌎">
        A quick, no-jargon guide — and how scoring works in this game.
      </PanelHeader>

      <Section title="The basics">
        <p>
          The 2026 World Cup is the biggest ever: <strong>48 teams</strong>, hosted across the
          USA, Canada and Mexico. It runs from <strong>June 11 to July 19, 2026</strong>, with{" "}
          <strong>104 matches</strong> in total.
        </p>
      </Section>

      <Section title="Stage 1 — Group stage">
        <p>
          The 48 teams are split into <strong>12 groups of 4</strong> (Groups A–L). Every team plays
          the other three in its group once. You get <strong>3 points</strong> for a win,{" "}
          <strong>1</strong> for a draw, <strong>0</strong> for a loss.
        </p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>The <strong>top 2 teams</strong> in every group advance — that's 24 teams.</li>
          <li>
            The <strong>8 best 3rd-placed teams</strong> (out of 12) also advance. That makes{" "}
            <strong>32 teams</strong> in the next stage.
          </li>
          <li>Teams level on points are separated by goal difference, then goals scored.</li>
        </ul>
      </Section>

      <Section title="Stage 2 — Knockouts">
        <p>From 32 teams it's single elimination — lose and you're out:</p>
        <p className="mt-2 font-semibold text-pitch-dark">
          Round of 32 → Round of 16 → Quarter-finals → Semi-finals → Final
        </p>
        <p className="mt-2">
          If a knockout match is tied after 90 minutes, they play 30 minutes of extra time, and if
          it's still level, a <strong>penalty shootout</strong> decides it. The two losing
          semi-finalists play a third-place match.
        </p>
      </Section>

      <Section title="How to play this game">
        <ol className="list-decimal ml-5 space-y-1">
          <li>Add each family member with the “+ Add player” button.</li>
          <li>
            On <strong>Fill Bracket → Groups</strong>, put each group in your predicted finishing
            order, then pick the 8 third-place teams you think advance.
          </li>
          <li>
            On <strong>Fill Bracket → Knockout</strong>, click your winner of every match, all the
            way to your champion. Once the group stage ends, this updates to the{" "}
            <strong>real Round of 32</strong> line-up so you pick on the actual bracket.
          </li>
          <li>
            As real games are played, open <strong>Results</strong> and hit “Refresh from internet”.
          </li>
          <li>Check the <strong>Leaderboard</strong> to see who's winning the family!</li>
        </ol>
      </Section>

      <Section title="How points are scored">
        <p className="font-semibold text-pitch-dark">Group stage (locked once the groups finish):</p>
        <ul className="list-disc ml-5 space-y-1 mt-1">
          <li><strong>4 pts</strong> for each team you correctly sent to the Round of 32.</li>
          <li><strong>+3 pts</strong> bonus for each group where you nailed the exact top-2 order.</li>
        </ul>
        <p className="font-semibold text-pitch-dark mt-3">
          Knockouts — once the group stage ends, everyone picks winners on the real bracket. You earn
          points for each match winner you pick correctly:
        </p>
        <ul className="list-disc ml-5 space-y-1 mt-1">
          <li><strong>5 pts</strong> — Round of 32</li>
          <li><strong>8 pts</strong> — Round of 16</li>
          <li><strong>12 pts</strong> — Quarter-finals</li>
          <li><strong>16 pts</strong> — Semi-finals</li>
          <li><strong>8 pts</strong> — Third-place play-off · <strong>20 pts</strong> — Final</li>
          <li><strong>+25 pts</strong> bonus for correctly naming the champion.</li>
        </ul>
        <p className="text-sm text-slate-500 mt-2">
          Your group-stage points are locked in when the groups finish, so they're safe no matter how
          the knockouts go.
        </p>
      </Section>

      <Section title="Where do my brackets save?">
        <p>
          Everything is saved right in this browser on this device — no logins, no accounts. Use{" "}
          <strong>Export</strong> on the top bar to download a backup file, and <strong>Import</strong>{" "}
          to restore it or move it to another device.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3 className="font-bold text-pitch-dark mb-1">{title}</h3>
      <div className="text-slate-700 text-sm leading-relaxed">{children}</div>
    </div>
  );
}
