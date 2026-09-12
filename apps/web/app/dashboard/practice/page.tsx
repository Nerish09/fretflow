"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  PracticeSession,
  createPracticeSession,
  deletePracticeSession,
  getPracticeSessions,
} from "../../../lib/api";

import Sidebar from "../components/Sidebar";

export default function PracticePage() {
  const [
    sessions,
    setSessions,
  ] = useState<
    PracticeSession[]
  >([]);

  const [focus, setFocus] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [minutes, setMinutes] =
    useState(30);

  const [
    timerSeconds,
    setTimerSeconds,
  ] = useState(0);

  const [
    timerRunning,
    setTimerRunning,
  ] = useState(false);

  async function loadSessions() {
    setSessions(
      await getPracticeSessions()
    );
  }

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (!timerRunning) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          setTimerSeconds(
            (current) =>
              current + 1
          );
        },
        1000
      );

    return () =>
      window.clearInterval(
        interval
      );
  }, [timerRunning]);

  const timerDisplay =
    useMemo(() => {
      const hours =
        Math.floor(
          timerSeconds / 3600
        );

      const minutes =
        Math.floor(
          (timerSeconds %
            3600) /
            60
        );

      const seconds =
        timerSeconds % 60;

      return [
        hours,
        minutes,
        seconds,
      ]
        .map((value) =>
          value
            .toString()
            .padStart(2, "0")
        )
        .join(":");
    }, [timerSeconds]);

  async function handleQuickLog(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!focus.trim()) {
      return;
    }

    await createPracticeSession(
      {
        focus:
          focus.trim(),

        duration_minutes:
          minutes,

        notes:
          notes.trim() ||
          null,
      }
    );

    setFocus("");
    setNotes("");
    setMinutes(30);

    await loadSessions();
  }

  async function finishSession() {
    if (
      !focus.trim() ||
      timerSeconds < 60
    ) {
      return;
    }

    await createPracticeSession(
      {
        focus:
          focus.trim(),

        duration_minutes:
          Math.max(
            1,
            Math.round(
              timerSeconds /
                60
            )
          ),

        notes:
          notes.trim() ||
          null,
      }
    );

    setTimerRunning(false);
    setTimerSeconds(0);
    setFocus("");
    setNotes("");

    await loadSessions();
  }

  async function handleDelete(
    session:
      PracticeSession
  ) {
    if (
      !window.confirm(
        `Remove "${session.focus}" from your practice history?`
      )
    ) {
      return;
    }

    await deletePracticeSession(
      session.id
    );

    await loadSessions();
  }

  const totalMinutes =
    sessions.reduce(
      (total, session) =>
        total +
        session.duration_minutes,
      0
    );

  return (
    <div className="studio-app">
      <Sidebar />

      <main className="practice-stage">
        <section className="practice-live">
          <div className="practice-live-header">
            <div>
              <p className="studio-kicker">
                LIVE ROOM
              </p>

              <span className="practice-live-status">
                <i
                  className={
                    timerRunning
                      ? "practice-live-light practice-live-light-on"
                      : "practice-live-light"
                  }
                />

                {timerRunning
                  ? "RECORDING"
                  : "READY"}
              </span>
            </div>

            <p>
              No distractions.
              <br />
              Just play.
            </p>
          </div>

          <div className="practice-clock">
            {timerDisplay}
          </div>

          <div className="practice-wave">
            {Array.from({
              length: 48,
            }).map(
              (_, index) => (
                <span
                  key={index}
                  className={
                    timerRunning
                      ? "practice-wave-active"
                      : ""
                  }
                  style={{
                    height: `${
                      12 +
                      ((index *
                        23) %
                        75)
                    }%`,
                  }}
                />
              )
            )}
          </div>

          <div className="practice-focus-area">
            <label>
              WHAT ARE YOU
              WORKING ON?

              <input
                value={focus}
                onChange={(
                  event
                ) =>
                  setFocus(
                    event
                      .target
                      .value
                  )
                }
                placeholder="Hotel California solo"
              />
            </label>

            <label>
              SESSION NOTES

              <textarea
                value={notes}
                onChange={(
                  event
                ) =>
                  setNotes(
                    event
                      .target
                      .value
                  )
                }
                placeholder="Optional notes..."
              />
            </label>
          </div>

          <div className="practice-transport">
            <button
              className="practice-main-control"
              onClick={() =>
                setTimerRunning(
                  (running) =>
                    !running
                )
              }
            >
              <span>
                {timerRunning
                  ? "Ⅱ"
                  : "▶"}
              </span>

              {timerRunning
                ? "PAUSE"
                : timerSeconds >
                    0
                  ? "RESUME"
                  : "START"}
            </button>

            {timerSeconds >
              0 && (
              <>
                <button
                  className="practice-finish"
                  onClick={
                    finishSession
                  }
                >
                  FINISH + SAVE
                </button>

                <button
                  className="practice-reset"
                  onClick={() => {
                    setTimerRunning(
                      false
                    );

                    setTimerSeconds(
                      0
                    );
                  }}
                >
                  RESET
                </button>
              </>
            )}
          </div>
        </section>

        <section className="practice-lower">
          <div className="practice-log-panel">
            <div>
              <p className="studio-kicker">
                QUICK LOG
              </p>

              <h2>
                Already played?
              </h2>
            </div>

            <form
              onSubmit={
                handleQuickLog
              }
            >
              <input
                required
                value={focus}
                onChange={(
                  event
                ) =>
                  setFocus(
                    event
                      .target
                      .value
                  )
                }
                placeholder="Practice focus"
              />

              <div>
                <input
                  type="number"
                  min="1"
                  value={minutes}
                  onChange={(
                    event
                  ) =>
                    setMinutes(
                      Number(
                        event
                          .target
                          .value
                      )
                    )
                  }
                />

                <span>
                  MIN
                </span>
              </div>

              <textarea
                value={notes}
                onChange={(
                  event
                ) =>
                  setNotes(
                    event
                      .target
                      .value
                  )
                }
                placeholder="Notes"
              />

              <button>
                LOG SESSION
              </button>
            </form>
          </div>

          <div className="practice-history">
            <div className="practice-history-heading">
              <div>
                <p className="studio-kicker">
                  SESSION TAPE
                </p>

                <h2>
                  Practice history
                </h2>
              </div>

              <strong>
                {Math.floor(
                  totalMinutes /
                    60
                )}
                h{" "}
                {totalMinutes %
                  60}
                m
              </strong>
            </div>

            <div className="practice-history-list">
              {sessions.map(
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
                        ).toLocaleDateString()}
                      </small>
                    </div>

                    <strong>
                      {
                        session.duration_minutes
                      }{" "}
                      MIN
                    </strong>

                    <button
                      onClick={() =>
                        handleDelete(
                          session
                        )
                      }
                    >
                      ×
                    </button>
                  </article>
                )
              )}

              {sessions.length ===
                0 && (
                <div className="practice-history-empty">
                  Your sessions will
                  appear here after you
                  start practicing.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}