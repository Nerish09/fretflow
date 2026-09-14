"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Exercise,
  PracticeGoals,
  PracticeSession,
  Song,
  getExercises,
  getPracticeGoals,
  getPracticeSessions,
  getSongs,
} from "../../lib/api";

import {
  getPracticeGoalSettings,
} from "../../lib/settings/practiceGoals";

import Sidebar from "./components/Sidebar";
import PageHeader from "./components/PageHeader";
import ProgressBar from "./components/ProgressBar";
import StatCard from "./components/StatCard";

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

export default function DashboardPage() {
  const [
    songs,
    setSongs,
  ] =
    useState<Song[]>([]);

  const [
    exercises,
    setExercises,
  ] =
    useState<Exercise[]>([]);

  const [
    sessions,
    setSessions,
  ] =
    useState<PracticeSession[]>([]);

  const [
    goals,
    setGoals,
  ] =
    useState<PracticeGoals | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  useEffect(() => {
    async function loadData() {
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

        setSongs(songData);
        setExercises(exerciseData);
        setSessions(sessionData);
        setGoals(goalData);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const totalMinutes =
    sessions.reduce(
      (
        total,
        session
      ) =>
        total +
        session.duration_minutes,
      0
    );

  const mastered =
    songs.filter(
      (
        song
      ) =>
        song.status ===
        "Mastered"
    ).length;

  const averageSongProgress =
    useMemo(() => {
      if (
        songs.length ===
        0
      ) {
        return 0;
      }

      return Math.round(
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
      );
    }, [
      songs,
    ]);

  const recentSessions =
    sessions.slice(
      0,
      4
    );

  const focusSongs =
    [...songs]
      .filter(
        (
          song
        ) =>
          song.status !==
          "Mastered"
      )
      .sort(
        (
          a,
          b
        ) =>
          calculateProgress(
            a.current_bpm,
            a.target_bpm
          ) -
          calculateProgress(
            b.current_bpm,
            b.target_bpm
          )
      )
      .slice(
        0,
        3
      );

  return (
    <div>
      <Sidebar />

      <main className="ff-page">
        <PageHeader
          eyebrow="HOME"
          title="Practice with purpose"
          description="Your songs, drills, goals and recent practice in one place."
          actions={
            <>
              <Link
                href="/dashboard/today"
                className="ff-button"
              >
                View today
              </Link>

              <Link
                href="/dashboard/practice"
                className="ff-button ff-button-primary"
              >
                ▶ Start practice
              </Link>
            </>
          }
        />

        <section className="ff-grid ff-grid-4 ff-home-stats">
          <StatCard
            label="Practice time"
            value={
              loading
                ? "—"
                : Math.floor(
                    totalMinutes /
                      60
                  )
            }
            suffix="H"
            detail={`${totalMinutes % 60} extra minutes`}
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
            label="Songs"
            value={
              loading
                ? "—"
                : songs.length
            }
            detail={`${mastered} mastered`}
          />

          <StatCard
            label="Average speed"
            value={
              loading
                ? "—"
                : averageSongProgress
            }
            suffix="%"
            detail="Toward song BPM targets"
          />
        </section>

        <section className="ff-grid ff-grid-2 ff-home-main">
          <article className="ff-panel">
            <div className="ff-panel-header">
              <div>
                <h2>
                  Today&apos;s goal
                </h2>

                <p>
                  Keep your practice
                  streak moving.
                </p>
              </div>

              <Link
                href="/dashboard/progress"
                className="ff-panel-link"
              >
                Progress →
              </Link>
            </div>

            <div className="ff-home-goal">
              <div>
                <strong>
                  {goals
                    ?.daily
                    .completed_minutes ??
                    0}
                </strong>

                <span>
                  /{" "}
                  {goals
                    ?.daily
                    .goal_minutes ??
                    30}{" "}
                  MIN
                </span>
              </div>

              <ProgressBar
                value={
                  goals
                    ?.daily
                    .progress_percent ??
                  0
                }
              />

              <p>
                {goals?.daily
                  .completed
                  ? "Daily goal complete."
                  : `${goals?.daily.remaining_minutes ?? 30} minutes left today.`}
              </p>
            </div>

            <Link
              href="/dashboard/today"
              className="ff-button ff-button-primary ff-home-plan-button"
            >
              Build today&apos;s plan
            </Link>
          </article>

          <article className="ff-panel">
            <div className="ff-panel-header">
              <div>
                <h2>
                  Needs attention
                </h2>

                <p>
                  Songs furthest from
                  their target speed.
                </p>
              </div>

              <Link
                href="/dashboard/songs"
                className="ff-panel-link"
              >
                All songs →
              </Link>
            </div>

            {focusSongs.length >
            0 ? (
              <div className="ff-focus-list">
                {focusSongs.map(
                  (
                    song
                  ) => {
                    const progress =
                      calculateProgress(
                        song.current_bpm,
                        song.target_bpm
                      );

                    return (
                      <article
                        key={
                          song.id
                        }
                      >
                        <div className="ff-focus-song">
                          <strong>
                            {
                              song.title
                            }
                          </strong>

                          <small>
                            {
                              song.artist
                            }
                          </small>
                        </div>

                        <div className="ff-focus-bpm">
                          <strong>
                            {
                              song.current_bpm
                            }
                          </strong>

                          <small>
                            →{" "}
                            {
                              song.target_bpm
                            }{" "}
                            BPM
                          </small>
                        </div>

                        <ProgressBar
                          value={
                            progress
                          }
                          showValue={
                            false
                          }
                        />
                      </article>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="ff-empty">
                Add a song to get
                started.
              </div>
            )}
          </article>
        </section>

        <section className="ff-grid ff-grid-2">
          <article className="ff-panel">
            <div className="ff-panel-header">
              <div>
                <h2>
                  Recent practice
                </h2>

                <p>
                  Your latest
                  sessions.
                </p>
              </div>

              <Link
                href="/dashboard/practice"
                className="ff-panel-link"
              >
                History →
              </Link>
            </div>

            {recentSessions.length >
            0 ? (
              <div className="ff-recent-list">
                {recentSessions.map(
                  (
                    session
                  ) => (
                    <article
                      key={
                        session.id
                      }
                    >
                      <div>
                        <strong>
                          {
                            session.focus
                          }
                        </strong>

                        <small>
                          {new Date(
                            session.started_at
                          ).toLocaleDateString()}
                        </small>
                      </div>

                      <strong>
                        {
                          session.duration_minutes
                        }{" "}
                        MIN
                      </strong>
                    </article>
                  )
                )}
              </div>
            ) : (
              <div className="ff-empty">
                No practice
                sessions yet.
              </div>
            )}
          </article>

          <article className="ff-panel">
            <div className="ff-panel-header">
              <div>
                <h2>
                  Library
                </h2>

                <p>
                  Everything you&apos;re
                  working on.
                </p>
              </div>
            </div>

            <div className="ff-library-links">
              <Link
                href="/dashboard/songs"
                className="ff-library-card"
              >
                <span>
                  Songs
                </span>

                <strong>
                  {
                    songs.length
                  }
                </strong>

                <small>
                  {
                    mastered
                  }{" "}
                  mastered
                </small>
              </Link>

              <Link
                href="/dashboard/exercises"
                className="ff-library-card"
              >
                <span>
                  Drills
                </span>

                <strong>
                  {
                    exercises.length
                  }
                </strong>

                <small>
                  Technique &
                  warm-ups
                </small>
              </Link>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}