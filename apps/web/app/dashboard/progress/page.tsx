"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BpmProgressPoint,
  Exercise,
  PracticeGoals,
  PracticeSession,
  Song,
  getBpmProgress,
  getExercises,
  getPracticeGoals,
  getPracticeSessions,
  getSongs,
} from "../../../lib/api";

import {
  getPracticeGoalSettings,
} from "../../../lib/settings/practiceGoals";

import Sidebar from "../components/Sidebar";
import GoalSettings from "../components/GoalSettings";
import PageHeader from "../components/PageHeader";
import ProgressBar from "../components/ProgressBar";
import StatCard from "../components/StatCard";

type DailyPractice = {
  date: Date;
  label: string;
  minutes: number;
};

type HistorySelection = {
  type:
    | "song"
    | "exercise";

  id: number;

  name: string;

  targetBpm: number;
};

function getDateKey(
  date: Date
) {
  return date
    .toISOString()
    .slice(
      0,
      10
    );
}

export default function ProgressPage() {
  const [
    songs,
    setSongs,
  ] =
    useState<Song[]>([]);

  const [
    exercises,
    setExercises,
  ] =
    useState<
      Exercise[]
    >([]);

  const [
    sessions,
    setSessions,
  ] =
    useState<
      PracticeSession[]
    >([]);

  const [
    goals,
    setGoals,
  ] =
    useState<
      PracticeGoals | null
    >(null);

  const [
    historySelection,
    setHistorySelection,
  ] =
    useState<
      HistorySelection | null
    >(null);

  const [
    history,
    setHistory,
  ] =
    useState<
      BpmProgressPoint[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    historyLoading,
    setHistoryLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  async function loadProgressData() {
    setLoading(true);
    setError("");

    try {
      const settings =
        getPracticeGoalSettings();

      const [
        songData,
        exerciseData,
        sessionData,
        goalData,
      ] =
        await Promise.all([
          getSongs(),
          getExercises(),
          getPracticeSessions(),
          getPracticeGoals(
            settings.dailyMinutes,
            settings.weeklyMinutes
          ),
        ]);

      setSongs(
        songData
      );

      setExercises(
        exerciseData
      );

      setSessions(
        sessionData
      );

      setGoals(
        goalData
      );

      if (
        !historySelection
      ) {
        if (
          songData.length >
          0
        ) {
          setHistorySelection({
            type:
              "song",

            id:
              songData[0]
                .id,

            name:
              songData[0]
                .title,

            targetBpm:
              songData[0]
                .target_bpm,
          });
        } else if (
          exerciseData.length >
          0
        ) {
          setHistorySelection({
            type:
              "exercise",

            id:
              exerciseData[0]
                .id,

            name:
              exerciseData[0]
                .name,

            targetBpm:
              exerciseData[0]
                .target_bpm,
          });
        }
      }
    } catch {
      setError(
        "Could not load progress data."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  useEffect(() => {
    loadProgressData();
  }, []);

  useEffect(() => {
    async function loadHistory() {
      if (
        !historySelection
      ) {
        setHistory(
          []
        );

        return;
      }

      setHistoryLoading(
        true
      );

      try {
        const data =
          await getBpmProgress(
            historySelection.type,
            historySelection.id
          );

        setHistory(
          data
        );
      } catch {
        setHistory(
          []
        );
      } finally {
        setHistoryLoading(
          false
        );
      }
    }

    loadHistory();
  }, [
    historySelection,
  ]);

  const lastSevenDays =
    useMemo<
      DailyPractice[]
    >(
      () => {
        const today =
          new Date();

        today.setHours(
          0,
          0,
          0,
          0
        );

        return Array.from(
          {
            length: 7,
          },
          (
            _,
            index
          ) => {
            const date =
              new Date(
                today
              );

            date.setDate(
              date.getDate() -
                (
                  6 -
                  index
                )
            );

            const key =
              getDateKey(
                date
              );

            const minutes =
              sessions
                .filter(
                  (
                    session
                  ) =>
                    getDateKey(
                      new Date(
                        session.started_at
                      )
                    ) ===
                    key
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
      [
        sessions,
      ]
    );

  const weeklyMinutes =
    lastSevenDays.reduce(
      (
        total,
        item
      ) =>
        total +
        item.minutes,
      0
    );

  const averageSession =
    sessions.length >
    0
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

  const activeDays =
    lastSevenDays.filter(
      (
        day
      ) =>
        day.minutes >
        0
    ).length;

  const maxMinutes =
    Math.max(
      1,
      ...lastSevenDays.map(
        (
          item
        ) =>
          item.minutes
      )
    );

  const latestBpm =
    history.length >
    0
      ? history[
          history.length -
            1
        ].bpm
      : 0;

  const bpmGain =
    history.length >=
    2
      ? latestBpm -
        history[0].bpm
      : 0;

  function selectHistory(
    value: string
  ) {
    const [
      type,
      idText,
    ] =
      value.split(
        ":"
      );

    const id =
      Number(
        idText
      );

    if (
      type ===
      "song"
    ) {
      const song =
        songs.find(
          (
            item
          ) =>
            item.id ===
            id
        );

      if (song) {
        setHistorySelection({
          type:
            "song",

          id:
            song.id,

          name:
            song.title,

          targetBpm:
            song.target_bpm,
        });
      }

      return;
    }

    const exercise =
      exercises.find(
        (
          item
        ) =>
          item.id ===
          id
      );

    if (
      exercise
    ) {
      setHistorySelection({
        type:
          "exercise",

        id:
          exercise.id,

        name:
          exercise.name,

        targetBpm:
          exercise.target_bpm,
      });
    }
  }

  return (
    <div>
      <Sidebar />

      <main className="ff-page">
        <PageHeader
          eyebrow="PROGRESS"
          title="See your improvement"
          description="Track consistency, practice goals, streaks and tempo progress in one place."
        />

        {error && (
          <div className="ff-error-box">
            {error}
          </div>
        )}

        <section className="ff-grid ff-grid-4 ff-progress-overview">
          <StatCard
            label="This week"
            value={
              loading
                ? "—"
                : weeklyMinutes
            }
            suffix="MIN"
            detail={`${activeDays} active days`}
            accent
          />

          <StatCard
            label="Current streak"
            value={
              loading
                ? "—"
                : goals
                    ?.streaks
                    .current ??
                  0
            }
            suffix="DAYS"
            detail={`Best: ${goals?.streaks.longest ?? 0} days`}
          />

          <StatCard
            label="Average session"
            value={
              loading
                ? "—"
                : averageSession
            }
            suffix="MIN"
            detail={`${sessions.length} sessions logged`}
          />

          <StatCard
            label="Practice days"
            value={
              loading
                ? "—"
                : goals
                    ?.streaks
                    .practice_days ??
                  0
            }
            detail="Total days practiced"
          />
        </section>

        <section className="ff-grid ff-grid-2 ff-progress-main">
          <article className="ff-panel">
            <div className="ff-panel-header">
              <div>
                <h2>
                  Practice goals
                </h2>

                <p>
                  Daily and rolling
                  7-day targets.
                </p>
              </div>
            </div>

            <div className="ff-goal-stack">
              <div className="ff-goal-row">
                <div className="ff-goal-copy">
                  <div>
                    <strong>
                      Daily
                    </strong>

                    <span>
                      {goals
                        ?.daily
                        .completed_minutes ??
                        0}
                      {" / "}
                      {goals
                        ?.daily
                        .goal_minutes ??
                        30}
                      {" min"}
                    </span>
                  </div>

                  <small>
                    {goals?.daily
                      .completed
                      ? "Complete ✓"
                      : `${goals?.daily.remaining_minutes ?? 30} min remaining`}
                  </small>
                </div>

                <ProgressBar
                  value={
                    goals
                      ?.daily
                      .progress_percent ??
                    0
                  }
                />
              </div>

              <div className="ff-goal-row">
                <div className="ff-goal-copy">
                  <div>
                    <strong>
                      7 days
                    </strong>

                    <span>
                      {goals
                        ?.weekly
                        .completed_minutes ??
                        0}
                      {" / "}
                      {goals
                        ?.weekly
                        .goal_minutes ??
                        180}
                      {" min"}
                    </span>
                  </div>

                  <small>
                    {goals?.weekly
                      .completed
                      ? "Complete ✓"
                      : `${goals?.weekly.remaining_minutes ?? 180} min remaining`}
                  </small>
                </div>

                <ProgressBar
                  value={
                    goals
                      ?.weekly
                      .progress_percent ??
                    0
                  }
                />
              </div>
            </div>

            <GoalSettings
              onSaved={
                loadProgressData
              }
            />
          </article>

          <article className="ff-panel">
            <div className="ff-panel-header">
              <div>
                <h2>
                  Last 7 days
                </h2>

                <p>
                  Practice minutes by
                  day.
                </p>
              </div>

              <strong className="ff-week-total">
                {weeklyMinutes}
                {" min"}
              </strong>
            </div>

            <div className="ff-week-bars">
              {lastSevenDays.map(
                (
                  day
                ) => (
                  <div
                    key={
                      getDateKey(
                        day.date
                      )
                    }
                    className="ff-week-day"
                  >
                    <div className="ff-week-bar-area">
                      {day.minutes >
                        0 && (
                        <span>
                          {
                            day.minutes
                          }
                        </span>
                      )}

                      <div
                        style={{
                          height: `${
                            day.minutes >
                            0
                              ? Math.max(
                                  12,
                                  (
                                    day.minutes /
                                    maxMinutes
                                  ) *
                                    100
                                )
                              : 4
                          }%`,
                        }}
                      />
                    </div>

                    <strong>
                      {
                        day.label
                      }
                    </strong>
                  </div>
                )
              )}
            </div>
          </article>
        </section>

        <section className="ff-panel ff-bpm-panel">
          <div className="ff-panel-header">
            <div>
              <h2>
                BPM progress
              </h2>

              <p>
                Track how your speed
                changes over time.
              </p>
            </div>

            <select
              className="ff-select ff-bpm-select"
              value={
                historySelection
                  ? `${historySelection.type}:${historySelection.id}`
                  : ""
              }
              onChange={(
                event
              ) =>
                selectHistory(
                  event
                    .target
                    .value
                )
              }
            >
              {songs.length >
                0 && (
                <optgroup label="Songs">
                  {songs.map(
                    (
                      song
                    ) => (
                      <option
                        key={
                          song.id
                        }
                        value={`song:${song.id}`}
                      >
                        {
                          song.title
                        }
                      </option>
                    )
                  )}
                </optgroup>
              )}

              {exercises.length >
                0 && (
                <optgroup label="Drills">
                  {exercises.map(
                    (
                      exercise
                    ) => (
                      <option
                        key={
                          exercise.id
                        }
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

          {!historySelection ? (
            <div className="ff-empty">
              Add a song or drill
              to begin tracking
              BPM.
            </div>
          ) : historyLoading ? (
            <div className="ff-empty">
              Loading history...
            </div>
          ) : (
            <>
              <div className="ff-grid ff-grid-3 ff-bpm-stats">
                <StatCard
                  label="Current"
                  value={
                    latestBpm
                  }
                  suffix="BPM"
                />

                <StatCard
                  label="Target"
                  value={
                    historySelection
                      .targetBpm
                  }
                  suffix="BPM"
                />

                <StatCard
                  label="Change"
                  value={
                    bpmGain >
                    0
                      ? `+${bpmGain}`
                      : bpmGain
                  }
                  suffix="BPM"
                  accent={
                    bpmGain >
                    0
                  }
                />
              </div>

              {history.length ===
              0 ? (
                <div className="ff-empty">
                  No BPM history
                  recorded yet.
                </div>
              ) : (
                <div className="ff-bpm-history">
                  {history.map(
                    (
                      point,
                      index
                    ) => (
                      <article
                        key={
                          point.id
                        }
                      >
                        <span>
                          {String(
                            index +
                              1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <div>
                          <strong>
                            {
                              point.bpm
                            }{" "}
                            BPM
                          </strong>

                          <small>
                            {new Date(
                              point.recorded_at
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

                        <ProgressBar
                          value={
                            historySelection
                              .targetBpm >
                            0
                              ? (
                                  point.bpm /
                                  historySelection.targetBpm
                                ) *
                                100
                              : 0
                          }
                          showValue={
                            false
                          }
                        />
                      </article>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}