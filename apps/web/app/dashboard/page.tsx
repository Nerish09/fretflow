"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Exercise,
  PracticeSession,
  Song,
  getExercises,
  getPracticeSessions,
  getSongs,
} from "../../lib/api";

import Sidebar from "./components/Sidebar";

export default function DashboardPage() {
  const [songs, setSongs] =
    useState<Song[]>([]);

  const [exercises, setExercises] =
    useState<Exercise[]>([]);

  const [sessions, setSessions] =
    useState<PracticeSession[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [
          songData,
          exerciseData,
          sessionData,
        ] = await Promise.all([
          getSongs(),
          getExercises(),
          getPracticeSessions(),
        ]);

        setSongs(songData);
        setExercises(exerciseData);
        setSessions(sessionData);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const totalMinutes = useMemo(
    () =>
      sessions.reduce(
        (total, session) =>
          total +
          session.duration_minutes,
        0
      ),
    [sessions]
  );

  const averageProgress = useMemo(() => {
    if (!songs.length) {
      return 0;
    }

    const total = songs.reduce(
      (sum, song) => {
        const progress =
          song.target_bpm > 0
            ? Math.min(
                100,
                Math.round(
                  (song.current_bpm /
                    song.target_bpm) *
                    100
                )
              )
            : 0;

        return sum + progress;
      },
      0
    );

    return Math.round(
      total / songs.length
    );
  }, [songs]);

  const mastered =
    songs.filter(
      (song) =>
        song.status === "Mastered"
    ).length;

  const latestSession =
    sessions[0] ?? null;

  return (
    <div className="studio-app">
      <Sidebar />

      <main className="studio-page">
        <section className="studio-hero">
          <div>
            <p className="studio-kicker">
              FRET / FLOW
            </p>

            <h1>
              Make every
              <br />
              minute count.
            </h1>

            <p className="studio-hero-copy">
              A focused practice space for
              building technique, learning
              songs, and tracking the speed
              you gain along the way.
            </p>
          </div>

          <div className="studio-hero-record">
            <span>YOUR PRACTICE</span>

            <strong>
              {loading
                ? "--"
                : Math.floor(
                    totalMinutes / 60
                  )}
              <small>H</small>
            </strong>

            <p>
              {totalMinutes % 60} minutes
              beyond the hour
            </p>
          </div>
        </section>

        <section className="studio-tape-strip">
          <div>
            <span>SONGS</span>
            <strong>
              {loading
                ? "—"
                : songs.length}
            </strong>
          </div>

          <div>
            <span>MASTERED</span>
            <strong>
              {loading ? "—" : mastered}
            </strong>
          </div>

          <div>
            <span>AVG. SPEED</span>
            <strong>
              {loading
                ? "—"
                : `${averageProgress}%`}
            </strong>
          </div>

          <div>
            <span>DRILLS</span>
            <strong>
              {loading
                ? "—"
                : exercises.length}
            </strong>
          </div>

          <div>
            <span>SESSIONS</span>
            <strong>
              {loading
                ? "—"
                : sessions.length}
            </strong>
          </div>
        </section>

        <section className="studio-dashboard-columns">
          <div className="studio-setlist-section">
            <div className="studio-section-heading">
              <div>
                <p className="studio-kicker">
                  CURRENT SETLIST
                </p>

                <h2>
                  Keep these moving.
                </h2>
              </div>

              <a href="/dashboard/songs">
                Full setlist →
              </a>
            </div>

            <div className="studio-dashboard-setlist">
              {songs.length === 0 ? (
                <div className="studio-empty-line">
                  Add a song to begin your
                  setlist.
                </div>
              ) : (
                songs
                  .slice(0, 5)
                  .map((song, index) => {
                    const progress =
                      Math.min(
                        100,
                        Math.round(
                          (song.current_bpm /
                            song.target_bpm) *
                            100
                        )
                      );

                    return (
                      <article
                        className="studio-setlist-row"
                        key={song.id}
                      >
                        <span className="studio-track-number">
                          {String(
                            index + 1
                          ).padStart(2, "0")}
                        </span>

                        <div className="studio-track-info">
                          <strong>
                            {song.title}
                          </strong>

                          <span>
                            {song.artist}
                          </span>
                        </div>

                        <div className="studio-track-bpm">
                          <strong>
                            {song.current_bpm}
                          </strong>

                          <span>
                            /{" "}
                            {song.target_bpm} BPM
                          </span>
                        </div>

                        <div className="studio-inline-meter">
                          <span
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                        </div>
                      </article>
                    );
                  })
              )}
            </div>
          </div>

          <aside className="studio-now-panel">
            <p className="studio-kicker">
              LAST SESSION
            </p>

            {latestSession ? (
              <>
                <div className="studio-waveform">
                  {Array.from({
                    length: 24,
                  }).map((_, index) => (
                    <span
                      key={index}
                      style={{
                        height: `${
                          20 +
                          ((index * 17) % 65)
                        }%`,
                      }}
                    />
                  ))}
                </div>

                <h2>
                  {latestSession.focus}
                </h2>

                <div className="studio-session-time">
                  <strong>
                    {
                      latestSession.duration_minutes
                    }
                  </strong>

                  <span>MINUTES</span>
                </div>

                <p>
                  {new Date(
                    latestSession.started_at
                  ).toLocaleDateString()}
                </p>
              </>
            ) : (
              <>
                <div className="studio-waveform studio-waveform-muted">
                  {Array.from({
                    length: 24,
                  }).map((_, index) => (
                    <span
                      key={index}
                      style={{
                        height: `${
                          15 +
                          ((index * 11) % 35)
                        }%`,
                      }}
                    />
                  ))}
                </div>

                <h2>
                  No sessions yet.
                </h2>

                <p>
                  Start playing and your
                  latest session will appear
                  here.
                </p>
              </>
            )}

            <a
              href="/dashboard/practice"
              className="studio-big-link"
            >
              Enter practice mode
              <span>↗</span>
            </a>
          </aside>
        </section>
      </main>
    </div>
  );
}