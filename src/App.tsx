import { useEffect, useMemo, useState } from "react";
import type { Bracket } from "./types";
import { buildTournament } from "./lib/feed";
import { actualKnockout, allStandings } from "./lib/standings";
import { autoFillRest } from "./lib/autofill";
import { bundledFeed, loadCachedFeed, refreshFeed, type FeedState } from "./lib/feedClient";
import {
  applyManualResults,
  loadManualResults,
  saveManualResults,
  type ManualResult,
  type ManualResults,
} from "./lib/manualResults";
import {
  createBracket,
  downloadBrackets,
  importBrackets,
  loadState,
  saveState,
} from "./lib/storage";
import BracketBar from "./components/BracketBar";
import GroupStage, { groupOrderOf } from "./components/GroupStage";
import Knockout from "./components/Knockout";
import ProgressPanel from "./components/ProgressPanel";
import Leaderboard from "./components/Leaderboard";
import Results from "./components/Results";
import Rules from "./components/Rules";
import Toast, { type ToastMessage } from "./components/Toast";
import MusicPlayer from "./components/MusicPlayer";
import Logo from "./components/Logo";

type Tab = "fill" | "leaderboard" | "results" | "rules";
type FillTab = "groups" | "knockout";

export default function App() {
  // The tournament skeleton (groups, teams, knockout wiring) is fixed — build it
  // once from the bundled snapshot. Live results only overlay scores.
  const tournament = useMemo(() => buildTournament(bundledFeed()), []);

  const [brackets, setBrackets] = useState<Bracket[]>(() => loadState().brackets);
  const [activeId, setActiveId] = useState<string | null>(() => loadState().brackets[0]?.id ?? null);
  const [feedState, setFeedState] = useState<FeedState>(() => loadCachedFeed());
  const [manual, setManual] = useState<ManualResults>(() => loadManualResults());
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>("fill");
  const [fillTab, setFillTab] = useState<FillTab>("groups");
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Try a live refresh on first load (silently falls back to cache/bundled).
  useEffect(() => {
    void doRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep results fresh automatically: refresh on a timer and when the user
  // returns to the tab, but only if our data is more than ~90s old.
  useEffect(() => {
    function maybeRefresh() {
      if (document.visibilityState !== "visible") return;
      const age = feedState.fetchedAt ? Date.now() - feedState.fetchedAt : Infinity;
      if (age > 90_000) void doRefresh();
    }
    window.addEventListener("focus", maybeRefresh);
    document.addEventListener("visibilitychange", maybeRefresh);
    const id = window.setInterval(maybeRefresh, 5 * 60_000);
    return () => {
      window.removeEventListener("focus", maybeRefresh);
      document.removeEventListener("visibilitychange", maybeRefresh);
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedState.fetchedAt]);

  const mergedFeed = useMemo(
    () => applyManualResults(feedState.data, manual),
    [feedState, manual],
  );
  const actualKO = useMemo(() => actualKnockout(mergedFeed), [mergedFeed]);
  const standings = useMemo(() => allStandings(tournament, mergedFeed), [tournament, mergedFeed]);

  const active = brackets.find((b) => b.id === activeId) ?? null;

  // ---- persistence helpers ----
  function persist(next: Bracket[]) {
    setBrackets(next);
    saveState({ version: 1, brackets: next });
  }

  function updateActive(mutator: (b: Bracket) => Bracket) {
    if (!active) return;
    const next = brackets.map((b) => (b.id === active.id ? { ...mutator(b), updatedAt: Date.now() } : b));
    persist(next);
  }

  async function doRefresh(notify = false) {
    setRefreshing(true);
    const state = await refreshFeed();
    setFeedState(state);
    setRefreshing(false);
    if (notify) {
      setToast(
        state.source === "live"
          ? { text: "Results updated from the internet ✓", kind: "success" }
          : { text: "Couldn't reach the live feed — showing saved results.", kind: "error" },
      );
    }
  }

  function setManualResult(key: string, result: ManualResult | null) {
    const next = { ...manual };
    if (result === null) delete next[key];
    else next[key] = result;
    setManual(next);
    saveManualResults(next);
  }

  // ---- bracket actions ----
  function addBracket(name: string) {
    const b = createBracket(name);
    persist([...brackets, b]);
    setActiveId(b.id);
    setTab("fill");
  }
  function deleteBracket(id: string) {
    const next = brackets.filter((b) => b.id !== id);
    persist(next);
    if (activeId === id) setActiveId(next[0]?.id ?? null);
  }
  function renameBracket(id: string, name: string) {
    persist(brackets.map((b) => (b.id === id ? { ...b, name: name.trim() || b.name } : b)));
  }
  function handleImport(json: string) {
    try {
      const imported = importBrackets(json);
      const byId = new Map(brackets.map((b) => [b.id, b]));
      for (const b of imported) byId.set(b.id, b);
      const merged = [...byId.values()];
      persist(merged);
      setActiveId(imported[0]?.id ?? activeId);
      setToast({ text: `Imported ${imported.length} bracket(s) ✓`, kind: "success" });
    } catch (err) {
      setToast({
        text: err instanceof Error ? err.message : "Could not import that file.",
        kind: "error",
      });
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="relative overflow-hidden bg-gradient-to-b from-pitch-dark to-pitch text-white shadow-lg border-b-4 border-white/80">
        {/* faint pitch markings */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.13] pointer-events-none"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <rect x="1" y="1" width="98" height="98" fill="none" stroke="white" strokeWidth="0.4" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="white" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="14" fill="none" stroke="white" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="1" fill="white" />
        </svg>
        <div className="relative max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 drop-shadow">
              <Logo className="h-9 w-9 drop-shadow" />
              <span>
                World Cup <span className="text-shimmer font-black">2026</span>
              </span>
              <span className="hidden sm:inline text-base font-semibold text-white/70">
                Family Bracket
              </span>
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-white/80 hidden md:block uppercase tracking-wide">
                🇺🇸 USA · 🇨🇦 Canada · 🇲🇽 Mexico
              </span>
              <MusicPlayer />
            </div>
          </div>
          <nav className="flex gap-1 mt-3 overflow-x-auto">
            <TabButton active={tab === "fill"} onClick={() => setTab("fill")}>Fill Bracket</TabButton>
            <TabButton active={tab === "leaderboard"} onClick={() => setTab("leaderboard")}>Leaderboard</TabButton>
            <TabButton active={tab === "results"} onClick={() => setTab("results")}>Results</TabButton>
            <TabButton active={tab === "rules"} onClick={() => setTab("rules")}>How it works</TabButton>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 space-y-4">
        <BracketBar
          tournament={tournament}
          brackets={brackets}
          activeId={activeId}
          onSelect={setActiveId}
          onCreate={addBracket}
          onDelete={deleteBracket}
          onRename={renameBracket}
          onExport={() => downloadBrackets(brackets)}
          onImport={handleImport}
        />

        <div key={tab} className="animate-fade-up space-y-4">
        {tab === "fill" &&
          (active ? (
            <>
              <ProgressPanel
                tournament={tournament}
                bracket={active}
                fillTab={fillTab}
                onGoTo={setFillTab}
                onAutoFill={() =>
                  updateActive((b) => ({ ...b, ...autoFillRest(tournament, b) }))
                }
                onReset={() =>
                  updateActive((b) => ({ ...b, groupOrder: {}, thirdPlaceTeams: [], knockoutPick: {} }))
                }
              />
              <div className="flex gap-2">
                <SubTab active={fillTab === "groups"} onClick={() => setFillTab("groups")}>
                  1–2. Groups
                </SubTab>
                <SubTab active={fillTab === "knockout"} onClick={() => setFillTab("knockout")}>
                  3. Knockout
                </SubTab>
              </div>
              {fillTab === "groups" ? (
                <GroupStage
                  tournament={tournament}
                  bracket={active}
                  standings={standings}
                  onChangeOrder={(letter, order) =>
                    updateActive((b) => {
                      const teams = tournament.groups.find((g) => g.letter === letter)?.teams ?? order;
                      const oldThird = groupOrderOf(b, letter, teams)[2];
                      const newThird = order[2];
                      let thirdPlaceTeams = b.thirdPlaceTeams;
                      // Keep this group's third-place pick attached to whoever is now 3rd.
                      if (oldThird !== newThird && thirdPlaceTeams.includes(oldThird)) {
                        thirdPlaceTeams = thirdPlaceTeams.map((t) => (t === oldThird ? newThird : t));
                      }
                      return { ...b, groupOrder: { ...b.groupOrder, [letter]: order }, thirdPlaceTeams };
                    })
                  }
                  onToggleThird={(team) =>
                    updateActive((b) => {
                      // Only count picks that are still a group's predicted 3rd-place team.
                      const valid = new Set(
                        tournament.groups.map((g) => groupOrderOf(b, g.letter, g.teams)[2]),
                      );
                      const chosen = b.thirdPlaceTeams.filter((t) => valid.has(t));
                      if (chosen.includes(team)) {
                        return { ...b, thirdPlaceTeams: chosen.filter((t) => t !== team) };
                      }
                      if (chosen.length >= 8) return { ...b, thirdPlaceTeams: chosen };
                      return { ...b, thirdPlaceTeams: [...chosen, team] };
                    })
                  }
                />
              ) : (
                <Knockout
                  tournament={tournament}
                  bracket={active}
                  actual={actualKO}
                  onPick={(num, team) =>
                    updateActive((b) => ({ ...b, knockoutPick: { ...b.knockoutPick, [num]: team } }))
                  }
                />
              )}
            </>
          ) : (
            <div className="card text-center py-10">
              <div className="text-5xl mb-2">⚽🏆</div>
              <h2 className="text-xl font-bold text-pitch-dark">Let's build some brackets!</h2>
              <p className="text-slate-500 mt-1 max-w-md mx-auto">
                Add each family member using the <strong>“+ Add player”</strong> box above, then pick
                your way through the groups and knockouts to crown your champion.
              </p>
              <p className="text-slate-400 text-sm mt-3">
                New to the World Cup? Tap <strong>“How it works”</strong> up top for a quick guide.
              </p>
            </div>
          ))}

        {tab === "leaderboard" && (
          <Leaderboard tournament={tournament} feed={mergedFeed} brackets={brackets} />
        )}

        {tab === "results" && (
          <Results
            tournament={tournament}
            feed={mergedFeed}
            liveFeed={feedState.data}
            feedState={feedState}
            manual={manual}
            refreshing={refreshing}
            onRefresh={() => doRefresh(true)}
            onSetManual={setManualResult}
          />
        )}

        {tab === "rules" && <Rules />}
        </div>
      </main>

      <footer className="text-center text-xs text-white/70 py-4">
        Built for family fun · results from openfootball · brackets saved on this device
      </footer>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button className={`tab-btn ${active ? "tab-btn-active" : "tab-btn-idle"}`} onClick={onClick}>
      {children}
    </button>
  );
}

function SubTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
        active ? "bg-pitch text-white" : "bg-white text-slate-600 border border-slate-200"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
