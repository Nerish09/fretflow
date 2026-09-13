"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BpmProgressPoint,
  Exercise,
  PracticeSession,
  Song,
  getBpmProgress,
  getExercises,
  getPracticeSessions,
  getSongs,
} from "../../../lib/api";

import Sidebar from "../components/Sidebar";

type DailyPractice = {
  date: Date;
  label: string;
  minutes: number;
};

type PracticeRecommendation = {
  type: "Song" | "Drill";
  name: string;
  detail: string;
  progress: number;
};

type HistorySelection = {
  type: "song" | "exercise";
  id: number;
  name: string;
  targetBpm: number;
};

function getStartOfDay(date: Date) {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
}

function getDateKey(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function calculateStreak(
  sessions: PracticeSession[]
) {
  if (sessions.length === 0) {
    return 0;
  }

  const practiceDays = new Set(
    sessions.map((session) =>
      getDateKey(
        new Date(
          session.started_at
        )
      )
    )
  );

  const today = getStartOfDay(
    new Date()
  );

  const yesterday = new Date(today);

  yesterday.setDate(
    yesterday.getDate() - 1
  );

  let cursor =
    practiceDays.has(
      getDateKey(today)
    )
      ? today
      : practiceDays.has(
            getDateKey(yesterday)
          )
        ? yesterday
        : null;

  if (!cursor) {
    return 0;
  }

  let streak = 0;

  while (
    practiceDays.has(
      getDateKey(cursor)
    )
  ) {
    streak += 1;

    cursor = new Date(cursor);

    cursor.setDate(
      cursor.getDate() - 1
    );
  }

  return streak;
}

function calculateProgress(
  current: number,
  target: number
) {
  if (target <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      (current / target) * 100
    )
  );
}

function formatPracticeTime(
  minutes: number
) {
  if (minutes < 60) {
    return {
      primary: String(minutes),
      unit: "MIN",
      secondary: "",
    };
  }

  const hours = Math.floor(
    minutes / 60
  );

  const remainingMinutes =
    minutes % 60;

  return {
    primary: String(hours),
    unit: "H",
    secondary:
      remainingMinutes > 0
        ? `${remainingMinutes} MIN`
        : "",
  };
}

export default function ProgressPage() {
  const [songs, setSongs] =
    useState<Song[]>([]);

  const [exercises, setExercises] =
    useState<Exercise[]>([]);

  const [sessions, setSessions] =
    useState<PracticeSession[]>([]);

  const [historySelection, setHistorySelection] =
    useState<HistorySelection | null>(null);

  const [history, setHistory] =
    useState<BpmProgressPoint[]>([]);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadData() {
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

        if (songData.length > 0) {
          setHistorySelection({
            type: "song",
            id: songData[0].id,
            name: songData[0].title,
            targetBpm:
              songData[0].target_bpm,
          });
        } else if (
          exerciseData.length > 0
        ) {
          setHistorySelection({
            type: "exercise",
            id: exerciseData[0].id,
            name: exerciseData[0].name,
            targetBpm:
              exerciseData[0]
                .target_bpm,
          });
        }
      } catch {
        setError(
          "Could not load progress data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    async function loadHistory() {
      if (!historySelection) {
        setHistory([]);
        return;
      }

      setHistoryLoading(true);

      try {
        const data =
          await getBpmProgress(
            historySelection.type,
            historySelection.id
          );

        setHistory(data);
      } catch {
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    }

    loadHistory();
  }, [historySelection]);

  const lastSevenDays =
    useMemo<DailyPractice[]>(
      () => {
        const today =
          getStartOfDay(
            new Date()
          );

        return Array.from(
          {
            length: 7,
          },
          (_, index) => {
            const date =
              new Date(today);

            date.setDate(
              date.getDate() -
                (6 - index)
            );

            const dateKey =
              getDateKey(date);

            const minutes =
              sessions
                .filter(
                  (session) =>
                    getDateKey(
                      new Date(
                        session.started_at
                      )
                    ) ===
                    dateKey
                )
                .reduce(
                  (
                    total,
                    session
                  ) =>
                    total +
                    session.duration_minutes,
                  0
                );

            return {
              date,
              label:
                date.toLocaleDateString(
                  undefined,
                  {
                    weekday:
                      "short",
                  }
                ),
              minutes,
            };
          }
        );
      },
      [sessions]
    );

  const weeklyMinutes =
    lastSevenDays.reduce(
      (total, day) =>
        total +
        day.minutes,
      0
    );

  const weeklyTime =
    formatPracticeTime(
      weeklyMinutes
    );

  const activeDays =
    lastSevenDays.filter(
      (day) =>
        day.minutes > 0
    ).length;

  const streak = useMemo(
    () =>
      calculateStreak(
        sessions
      ),
    [sessions]
  );

  const averageSession =
    sessions.length > 0
      ? Math.round(
          sessions.reduce(
            (
              total,
              session
            ) =>
              total +
              session.duration_minutes,
            0
          ) /
            sessions.length
        )
      : 0;

  const masteredSongs =
    songs.filter(
      (song) =>
        song.status ===
        "Mastered"
    );

  const averageSongProgress =
    songs.length > 0
      ? Math.round(
          songs.reduce(
            (
              total,
              song
            ) =>
              total +
              calculateProgress(
                song.current_bpm,
                song.target_bpm
              ),
            0
          ) / songs.length
        )
      : 0;

  const recommendations =
    useMemo<
      PracticeRecommendation[]
    >(() => {
      const songOptions =
        songs
          .filter(
            (song) =>
              song.status !==
              "Mastered"
          )
          .map((song) => {
            const progress =
              calculateProgress(
                song.current_bpm,
                song.target_bpm
              );

            return {
              type:
                "Song" as const,
              name: song.title,
              detail: `${song.current_bpm} → ${song.target_bpm} BPM`,
              progress,
            };
          });

      const exerciseOptions =
        exercises.map(
          (exercise) => {
            const progress =
              calculateProgress(
                exercise.current_bpm,
                exercise.target_bpm
              );

            return {
              type:
                "Drill" as const,
              name:
                exercise.name,
              detail: `${exercise.category} · ${exercise.current_bpm} → ${exercise.target_bpm} BPM`,
              progress,
            };
          }
        );

      return [
        ...songOptions,
        ...exerciseOptions,
      ]
        .sort(
          (a, b) =>
            a.progress -
            b.progress
        )
        .slice(0, 3);
    }, [
      songs,
      exercises,
    ]);

  const maxDailyMinutes =
    Math.max(
      1,
      ...lastSevenDays.map(
        (day) =>
          day.minutes
      )
    );

  const bpmGain =
    history.length >= 2
      ? history[
          history.length - 1
        ].bpm -
        history[0].bpm
      : 0;

  const latestBpm =
    history.length > 0
      ? history[
          history.length - 1
        ].bpm
      : 0;

  const historyMin =
    history.length > 0
      ? Math.min(
          ...history.map(
            (point) =>
              point.bpm
          )
        )
      : 0;

  const historyMax =
    historySelection
      ? Math.max(
          historySelection.targetBpm,
          ...history.map(
            (point) =>
              point.bpm
          )
        )
      : 100;

  const historyRange =
    Math.max(
      1,
      historyMax - historyMin
    );

  function selectHistory(
    value: string
  ) {
    const [type, idValue] =
      value.split(":");

    const id =
      Number(idValue);

    if (type === "song") {
      const song =
        songs.find(
          (item) =>
            item.id === id
        );

      if (!song) {
        return;
      }

      setHistorySelection({
        type: "song",
        id: song.id,
        name: song.title,
        targetBpm:
          song.target_bpm,
      });

      return;
    }

    const exercise =
      exercises.find(
        (item) =>
          item.id === id
      );

    if (!exercise) {
      return;
    }

    setHistorySelection({
      type: "exercise",
      id: exercise.id,
      name: exercise.name,
      targetBpm:
        exercise.target_bpm,
    });
  }

  return (
    <div className="studio-app">
      <Sidebar />

      <main className="studio-page progress-page">
        <section className="progress-hero">
          <div>
            <p className="studio-kicker">
              PROGRESS TAPE
            </p>

            <h1>
              See the work
              <br />
              adding up.
            </h1>

            <p>
              Practice only feels slow
              when you can&apos;t see how
              far you&apos;ve already
              moved.
            </p>
          </div>

          <div className="progress-hero-number">
            <span>
              7 DAY PRACTICE
            </span>

            <strong>
              {loading
                ? "—"
                : weeklyTime.primary}
              {!loading && (
                <small>
                  {weeklyTime.unit}
                </small>
              )}
            </strong>

            <p>
              {loading
                ? ""
                : weeklyTime.secondary ||
                  "Last 7 days"}
            </p>
          </div>
        </section>

        {error && (
          <div className="progress-error">
            {error}
          </div>
        )}

        <section className="progress-stat-strip">
          <article>
            <span>
              ACTIVE DAYS
            </span>

            <strong>
              {loading
                ? "—"
                : `${activeDays}/7`}
            </strong>

            <small>
              This week
            </small>
          </article>

          <article>
            <span>
              CURRENT STREAK
            </span>

            <strong>
              {loading
                ? "—"
                : streak}
            </strong>

            <small>
              {streak === 1
                ? "Day"
                : "Days"}
            </small>
          </article>

          <article>
            <span>
              AVG. SESSION
            </span>

            <strong>
              {loading
                ? "—"
                : averageSession}
            </strong>

            <small>
              Minutes
            </small>
          </article>

          <article>
            <span>
              SONG SPEED
            </span>

            <strong>
              {loading
                ? "—"
                : `${averageSongProgress}%`}
            </strong>

            <small>
              Avg. toward goal
            </small>
          </article>

          <article>
            <span>
              MASTERED
            </span>

            <strong>
              {loading
                ? "—"
                : masteredSongs.length}
            </strong>

            <small>
              Songs
            </small>
          </article>
        </section>

        <section className="bpm-history-section">
          <div className="progress-section-heading">
            <div>
              <p className="studio-kicker">
                SPEED HISTORY
              </p>

              <h2>
                BPM over time
              </h2>
            </div>

            <select
              className="bpm-history-select"
              value={
                historySelection
                  ? `${historySelection.type}:${historySelection.id}`
                  : ""
              }
              onChange={(event) =>
                selectHistory(
                  event.target.value
                )
              }
            >
              {songs.length > 0 && (
                <optgroup label="Songs">
                  {songs.map(
                    (song) => (
                      <option
                        key={`song-${song.id}`}
                        value={`song:${song.id}`}
                      >
                        {song.title}
                      </option>
                    )
                  )}
                </optgroup>
              )}

              {exercises.length > 0 && (
                <optgroup label="Drills">
                  {exercises.map(
                    (exercise) => (
                      <option
                        key={`exercise-${exercise.id}`}
                        value={`exercise:${exercise.id}`}
                      >
                        {
                          exercise.name
                        }
                      </option>
                    )
                  )}
                </optgroup>
              )}
            </select>
          </div>

          {historySelection ? (
            <>
              <div className="bpm-history-summary">
                <div>
                  <span>
                    CURRENT
                  </span>

                  <strong>
                    {historyLoading
                      ? "—"
                      : latestBpm}
                    <small>
                      BPM
                    </small>
                  </strong>
                </div>

                <div>
                  <span>
                    TARGET
                  </span>

                  <strong>
                    {
                      historySelection.targetBpm
                    }
                    <small>
                      BPM
                    </small>
                  </strong>
                </div>

                <div>
                  <span>
                    CHANGE
                  </span>

                  <strong
                    className={
                      bpmGain > 0
                        ? "bpm-gain-positive"
                        : bpmGain < 0
                          ? "bpm-gain-negative"
                          : ""
                    }
                  >
                    {bpmGain > 0
                      ? "+"
                      : ""}
                    {bpmGain}
                    <small>
                      BPM
                    </small>
                  </strong>
                </div>

                <div>
                  <span>
                    RECORDS
                  </span>

                  <strong>
                    {history.length}
                  </strong>
                </div>
              </div>

              <div className="bpm-history-chart">
                {historyLoading ? (
                  <div className="bpm-history-empty">
                    Loading BPM history...
                  </div>
                ) : history.length === 0 ? (
                  <div className="bpm-history-empty">
                    No BPM history yet.
                  </div>
                ) : (
                  history.map(
                    (
                      point,
                      index
                    ) => {
                      const height =
                        Math.max(
                          8,
                          ((point.bpm -
                            historyMin) /
                            historyRange) *
                            82 +
                            10
                        );

                      return (
                        <div
                          className="bpm-history-point"
                          key={
                            point.id
                          }
                        >
                          <div className="bpm-history-column">
                            <span className="bpm-history-value">
                              {
                                point.bpm
                              }
                            </span>

                            <div
                              className="bpm-history-bar"
                              style={{
                                height: `${height}%`,
                              }}
                            />

                            <span className="bpm-history-dot" />
                          </div>

                          <strong>
                            {new Date(
                              point.recorded_at
                            ).toLocaleDateString(
                              undefined,
                              {
                                month:
                                  "short",
                                day:
                                  "numeric",
                              }
                            )}
                          </strong>

                          <small>
                            #
                            {
                              index +
                              1
                            }
                          </small>
                        </div>
                      );
                    }
                  )
                )}

                {history.length > 0 && (
                  <div
                    className="bpm-target-line"
                    style={{
                      bottom: `${Math.min(
                        92,
                        Math.max(
                          10,
                          ((historySelection.targetBpm -
                            historyMin) /
                            historyRange) *
                            82 +
                            10
                        )
                      )}%`,
                    }}
                  >
                    <span>
                      TARGET{" "}
                      {
                        historySelection.targetBpm
                      }{" "}
                      BPM
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bpm-history-empty">
              Add a song or drill to
              start tracking BPM.
            </div>
          )}
        </section>

        <section className="progress-week-section">
          <div className="progress-section-heading">
            <div>
              <p className="studio-kicker">
                LAST 7 DAYS
              </p>

              <h2>
                Practice rhythm
              </h2>
            </div>

            <p>
              {weeklyMinutes} minutes
              total
            </p>
          </div>

          <div className="progress-week-chart">
            {lastSevenDays.map(
              (day) => {
                const height =
                  day.minutes ===
                  0
                    ? 3
                    : Math.max(
                        10,
                        Math.round(
                          (day.minutes /
                            maxDailyMinutes) *
                            100
                        )
                      );

                return (
                  <div
                    className="progress-day"
                    key={getDateKey(
                      day.date
                    )}
                  >
                    <div className="progress-bar-area">
                      {day.minutes >
                        0 && (
                        <span className="progress-bar-value">
                          {
                            day.minutes
                          }
                          m
                        </span>
                      )}

                      <div
                        className={
                          day.minutes >
                          0
                            ? "progress-day-bar progress-day-bar-active"
                            : "progress-day-bar"
                        }
                        style={{
                          height: `${height}%`,
                        }}
                      />
                    </div>

                    <strong>
                      {day.label}
                    </strong>

                    <small>
                      {day.date.toLocaleDateString(
                        undefined,
                        {
                          month:
                            "numeric",
                          day:
                            "numeric",
                        }
                      )}
                    </small>
                  </div>
                );
              }
            )}
          </div>
        </section>

        <section className="progress-main-grid">
          <div className="progress-next-panel">
            <div className="progress-section-heading">
              <div>
                <p className="studio-kicker">
                  NEXT UP
                </p>

                <h2>
                  Where to focus
                </h2>
              </div>
            </div>

            {recommendations.length ===
            0 ? (
              <div className="progress-empty">
                Add songs or drills
                and FretFlow will
                suggest what needs
                the most attention.
              </div>
            ) : (
              <div className="progress-recommendations">
                {recommendations.map(
                  (
                    item,
                    index
                  ) => (
                    <article
                      key={`${item.type}-${item.name}`}
                    >
                      <span className="progress-rec-number">
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </span>

                      <div className="progress-rec-info">
                        <span>
                          {item.type}
                        </span>

                        <strong>
                          {
                            item.name
                          }
                        </strong>

                        <small>
                          {
                            item.detail
                          }
                        </small>
                      </div>

                      <div className="progress-rec-meter">
                        <div>
                          <span
                            style={{
                              width: `${item.progress}%`,
                            }}
                          />
                        </div>

                        <strong>
                          {
                            item.progress
                          }
                          %
                        </strong>
                      </div>

                      <a href="/dashboard/practice">
                        PRACTICE →
                      </a>
                    </article>
                  )
                )}
              </div>
            )}
          </div>

          <aside className="progress-milestones">
            <p className="studio-kicker">
              MILESTONES
            </p>

            <h2>
              Wins so far.
            </h2>

            <div className="progress-milestone-list">
              {masteredSongs.length >
              0 ? (
                masteredSongs
                  .slice(0, 4)
                  .map(
                    (song) => (
                      <article
                        key={
                          song.id
                        }
                      >
                        <span>
                          ★
                        </span>

                        <div>
                          <strong>
                            {
                              song.title
                            }
                          </strong>

                          <small>
                            Mastered ·{" "}
                            {
                              song.target_bpm
                            }{" "}
                            BPM target
                          </small>
                        </div>
                      </article>
                    )
                  )
              ) : (
                <div className="progress-empty">
                  Your mastered
                  songs will appear
                  here.
                </div>
              )}
            </div>
          </aside>
        </section>

        <section className="progress-session-section">
          <div className="progress-section-heading">
            <div>
              <p className="studio-kicker">
                RECENT TAPE
              </p>

              <h2>
                Latest sessions
              </h2>
            </div>

            <a href="/dashboard/practice">
              Practice history →
            </a>
          </div>

          <div className="progress-session-list">
            {sessions
              .slice(0, 6)
              .map(
                (
                  session,
                  index
                ) => (
                  <article
                    key={
                      session.id
                    }
                  >
                    <span>
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <div>
                      <strong>
                        {
                          session.focus
                        }
                      </strong>

                      <small>
                        {new Date(
                          session.started_at
                        ).toLocaleDateString(
                          undefined,
                          {
                            month:
                              "short",
                            day:
                              "numeric",
                            year:
                              "numeric",
                          }
                        )}
                      </small>
                    </div>

                    <strong>
                      {
                        session.duration_minutes
                      }
                      <small>
                        MIN
                      </small>
                    </strong>
                  </article>
                )
              )}

            {sessions.length ===
              0 && (
              <div className="progress-empty">
                Your practice
                sessions will show
                up here.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}