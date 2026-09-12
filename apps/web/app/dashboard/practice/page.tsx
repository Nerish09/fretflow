"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Exercise,
  PracticeSession,
  Song,
  createPracticeSession,
  deletePracticeSession,
  getExercises,
  getPracticeSessions,
  getSongs,
} from "../../../lib/api";

import Sidebar from "../components/Sidebar";

type PracticeTargetType =
  | "song"
  | "exercise"
  | "custom";

type PracticeSummary = {
  focus: string;
  durationMinutes: number;
  bpm: number;
  notes: string;
};

export default function PracticePage() {
  const [sessions, setSessions] =
    useState<PracticeSession[]>([]);

  const [songs, setSongs] =
    useState<Song[]>([]);

  const [exercises, setExercises] =
    useState<Exercise[]>([]);

  const [targetType, setTargetType] =
    useState<PracticeTargetType>("song");

  const [selectedTarget, setSelectedTarget] =
    useState("");

  const [focus, setFocus] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [minutes, setMinutes] =
    useState(30);

  const [practiceBpm, setPracticeBpm] =
    useState(80);

  const [timerSeconds, setTimerSeconds] =
    useState(0);

  const [timerRunning, setTimerRunning] =
    useState(false);

  const [metronomeRunning, setMetronomeRunning] =
    useState(false);

  const [summary, setSummary] =
    useState<PracticeSummary | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const audioContextRef =
    useRef<AudioContext | null>(null);

  const metronomeIntervalRef =
    useRef<number | null>(null);

  async function loadData() {
    try {
      const [
        sessionData,
        songData,
        exerciseData,
      ] = await Promise.all([
        getPracticeSessions(),
        getSongs(),
        getExercises(),
      ]);

      setSessions(sessionData);
      setSongs(songData);
      setExercises(exerciseData);
    } catch {
      setError(
        "Could not load your practice data."
      );
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!timerRunning) {
      return;
    }

    const interval =
      window.setInterval(() => {
        setTimerSeconds(
          (current) => current + 1
        );
      }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [timerRunning]);

  useEffect(() => {
    if (!metronomeRunning) {
      stopMetronomeInterval();
      return;
    }

    startMetronomeInterval();

    return () => {
      stopMetronomeInterval();
    };
  }, [
    metronomeRunning,
    practiceBpm,
  ]);

  useEffect(() => {
    return () => {
      stopMetronomeInterval();

      if (
        audioContextRef.current &&
        audioContextRef.current.state !==
          "closed"
      ) {
        audioContextRef.current.close();
      }
    };
  }, []);

  function stopMetronomeInterval() {
    if (
      metronomeIntervalRef.current !==
      null
    ) {
      window.clearInterval(
        metronomeIntervalRef.current
      );

      metronomeIntervalRef.current =
        null;
    }
  }

  function playClick() {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current =
        new AudioContext();
    }

    const context =
      audioContextRef.current;

    const oscillator =
      context.createOscillator();

    const gain =
      context.createGain();

    oscillator.type = "square";

    oscillator.frequency.value =
      950;

    gain.gain.setValueAtTime(
      0.14,
      context.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      context.currentTime + 0.05
    );

    oscillator.connect(gain);
    gain.connect(
      context.destination
    );

    oscillator.start();

    oscillator.stop(
      context.currentTime + 0.06
    );
  }

  function startMetronomeInterval() {
    stopMetronomeInterval();

    playClick();

    const intervalMs =
      60000 / practiceBpm;

    metronomeIntervalRef.current =
      window.setInterval(
        playClick,
        intervalMs
      );
  }

  async function toggleMetronome() {
    if (
      !audioContextRef.current
    ) {
      audioContextRef.current =
        new AudioContext();
    }

    if (
      audioContextRef.current.state ===
      "suspended"
    ) {
      await audioContextRef.current.resume();
    }

    setMetronomeRunning(
      (current) => !current
    );
  }

  function changeBpm(
    amount: number
  ) {
    setPracticeBpm(
      (current) =>
        Math.min(
          300,
          Math.max(
            20,
            current + amount
          )
        )
    );
  }

  function selectSong(
    songId: string
  ) {
    setSelectedTarget(songId);

    const song =
      songs.find(
        (item) =>
          item.id ===
          Number(songId)
      );

    if (!song) {
      return;
    }

    setFocus(
      `${song.title} — ${song.artist}`
    );

    setPracticeBpm(
      song.current_bpm
    );
  }

  function selectExercise(
    exerciseId: string
  ) {
    setSelectedTarget(
      exerciseId
    );

    const exercise =
      exercises.find(
        (item) =>
          item.id ===
          Number(exerciseId)
      );

    if (!exercise) {
      return;
    }

    setFocus(
      exercise.name
    );

    setPracticeBpm(
      exercise.current_bpm
    );
  }

  function changeTargetType(
    type: PracticeTargetType
  ) {
    setTargetType(type);
    setSelectedTarget("");
    setFocus("");

    if (type === "custom") {
      setPracticeBpm(80);
    }
  }

  const timerDisplay =
    useMemo(() => {
      const hours =
        Math.floor(
          timerSeconds / 3600
        );

      const mins =
        Math.floor(
          (timerSeconds %
            3600) /
            60
        );

      const seconds =
        timerSeconds % 60;

      return [
        hours,
        mins,
        seconds,
      ]
        .map((value) =>
          value
            .toString()
            .padStart(2, "0")
        )
        .join(":");
    }, [timerSeconds]);

  function prepareFinish() {
    if (!focus.trim()) {
      setError(
        "Choose what you practiced first."
      );

      return;
    }

    if (timerSeconds < 1) {
      setError(
        "Start the timer before finishing the session."
      );

      return;
    }

    setTimerRunning(false);
    setMetronomeRunning(false);
    setError("");

    setSummary({
      focus: focus.trim(),

      durationMinutes:
        Math.max(
          1,
          Math.round(
            timerSeconds / 60
          )
        ),

      bpm: practiceBpm,

      notes: notes.trim(),
    });
  }

  async function saveFinishedSession() {
    if (!summary) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const bpmNote =
        `Practice BPM: ${summary.bpm}`;

      const finalNotes =
        summary.notes
          ? `${bpmNote}\n${summary.notes}`
          : bpmNote;

      await createPracticeSession({
        focus: summary.focus,

        duration_minutes:
          summary.durationMinutes,

        notes: finalNotes,
      });

      resetLiveSession();

      await loadData();
    } catch {
      setError(
        "Could not save the practice session."
      );
    } finally {
      setSaving(false);
    }
  }

  function resetLiveSession() {
    setTimerRunning(false);
    setMetronomeRunning(false);
    setTimerSeconds(0);

    setTargetType("song");
    setSelectedTarget("");
    setFocus("");
    setNotes("");
    setPracticeBpm(80);
    setSummary(null);
  }

  async function handleQuickLog(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!focus.trim()) {
      return;
    }

    const bpmNote =
      `Practice BPM: ${practiceBpm}`;

    const finalNotes =
      notes.trim()
        ? `${bpmNote}\n${notes.trim()}`
        : bpmNote;

    await createPracticeSession({
      focus: focus.trim(),

      duration_minutes:
        minutes,

      notes: finalNotes,
    });

    setFocus("");
    setNotes("");
    setMinutes(30);

    await loadData();
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

    await loadData();
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
                  ? "SESSION ACTIVE"
                  : "READY"}
              </span>
            </div>

            <p>
              Tune everything else out.
              <br />
              Work on one thing at a time.
            </p>
          </div>

          <div className="practice-target-picker">
            <div className="practice-target-tabs">
              <button
                type="button"
                className={
                  targetType ===
                  "song"
                    ? "practice-target-tab practice-target-tab-active"
                    : "practice-target-tab"
                }
                onClick={() =>
                  changeTargetType(
                    "song"
                  )
                }
              >
                SONG
              </button>

              <button
                type="button"
                className={
                  targetType ===
                  "exercise"
                    ? "practice-target-tab practice-target-tab-active"
                    : "practice-target-tab"
                }
                onClick={() =>
                  changeTargetType(
                    "exercise"
                  )
                }
              >
                DRILL
              </button>

              <button
                type="button"
                className={
                  targetType ===
                  "custom"
                    ? "practice-target-tab practice-target-tab-active"
                    : "practice-target-tab"
                }
                onClick={() =>
                  changeTargetType(
                    "custom"
                  )
                }
              >
                CUSTOM
              </button>
            </div>

            {targetType ===
              "song" && (
              <select
                value={
                  selectedTarget
                }
                onChange={(
                  event
                ) =>
                  selectSong(
                    event
                      .target
                      .value
                  )
                }
              >
                <option value="">
                  Select a song
                </option>

                {songs.map(
                  (song) => (
                    <option
                      key={
                        song.id
                      }
                      value={
                        song.id
                      }
                    >
                      {song.title} —{" "}
                      {song.artist}
                    </option>
                  )
                )}
              </select>
            )}

            {targetType ===
              "exercise" && (
              <select
                value={
                  selectedTarget
                }
                onChange={(
                  event
                ) =>
                  selectExercise(
                    event
                      .target
                      .value
                  )
                }
              >
                <option value="">
                  Select a drill
                </option>

                {exercises.map(
                  (exercise) => (
                    <option
                      key={
                        exercise.id
                      }
                      value={
                        exercise.id
                      }
                    >
                      {
                        exercise.name
                      }{" "}
                      —{" "}
                      {
                        exercise.category
                      }
                    </option>
                  )
                )}
              </select>
            )}

            {targetType ===
              "custom" && (
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
                placeholder="What are you working on?"
              />
            )}
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

          <section className="practice-metronome">
            <div className="practice-metronome-heading">
              <div>
                <p>
                  METRONOME
                </p>

                <strong>
                  {practiceBpm}
                  <span>BPM</span>
                </strong>
              </div>

              <button
                type="button"
                className={
                  metronomeRunning
                    ? "practice-metronome-toggle practice-metronome-toggle-on"
                    : "practice-metronome-toggle"
                }
                onClick={
                  toggleMetronome
                }
              >
                <span />

                {metronomeRunning
                  ? "ON"
                  : "OFF"}
              </button>
            </div>

            <div className="practice-bpm-controls">
              <button
                type="button"
                onClick={() =>
                  changeBpm(-5)
                }
              >
                −5
              </button>

              <input
                type="range"
                min="20"
                max="300"
                value={
                  practiceBpm
                }
                onChange={(
                  event
                ) =>
                  setPracticeBpm(
                    Number(
                      event
                        .target
                        .value
                    )
                  )
                }
              />

              <button
                type="button"
                onClick={() =>
                  changeBpm(5)
                }
              >
                +5
              </button>
            </div>
          </section>

          {focus && (
            <div className="practice-current-focus">
              <span>
                CURRENT FOCUS
              </span>

              <strong>
                {focus}
              </strong>
            </div>
          )}

          <div className="practice-focus-area practice-focus-area-single">
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
                placeholder="What felt good? What still needs work?"
              />
            </label>
          </div>

          {error && (
            <p className="practice-error">
              {error}
            </p>
          )}

          <div className="practice-transport">
            <button
              className="practice-main-control"
              onClick={() => {
                if (
                  !focus.trim()
                ) {
                  setError(
                    "Choose what you want to practice first."
                  );

                  return;
                }

                setError("");

                setTimerRunning(
                  (running) =>
                    !running
                );
              }}
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
                    prepareFinish
                  }
                >
                  FINISH
                </button>

                <button
                  className="practice-reset"
                  onClick={
                    resetLiveSession
                  }
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

              <div className="practice-quick-bpm">
                <input
                  type="number"
                  min="20"
                  max="300"
                  value={
                    practiceBpm
                  }
                  onChange={(
                    event
                  ) =>
                    setPracticeBpm(
                      Number(
                        event
                          .target
                          .value
                      )
                    )
                  }
                />

                <span>
                  BPM
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

        {summary && (
          <div className="practice-summary-overlay">
            <section className="practice-summary">
              <p className="studio-kicker">
                SESSION COMPLETE
              </p>

              <h2>
                Nice work.
              </h2>

              <p className="practice-summary-focus">
                {summary.focus}
              </p>

              <div className="practice-summary-stats">
                <div>
                  <span>
                    TIME
                  </span>

                  <strong>
                    {
                      summary.durationMinutes
                    }
                  </strong>

                  <small>
                    MIN
                  </small>
                </div>

                <div>
                  <span>
                    TEMPO
                  </span>

                  <strong>
                    {
                      summary.bpm
                    }
                  </strong>

                  <small>
                    BPM
                  </small>
                </div>
              </div>

              {summary.notes && (
                <div className="practice-summary-notes">
                  <span>
                    NOTES
                  </span>

                  <p>
                    {
                      summary.notes
                    }
                  </p>
                </div>
              )}

              <div className="practice-summary-actions">
                <button
                  className="practice-summary-save"
                  onClick={
                    saveFinishedSession
                  }
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "SAVING..."
                    : "SAVE SESSION"}
                </button>

                <button
                  className="practice-summary-cancel"
                  onClick={() =>
                    setSummary(
                      null
                    )
                  }
                  disabled={
                    saving
                  }
                >
                  KEEP PRACTICING
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}