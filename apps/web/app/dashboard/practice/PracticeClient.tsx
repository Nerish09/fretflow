"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useSearchParams } from "next/navigation";

import {
  Exercise,
  PracticeSession,
  Song,
  completePracticeSession,
  createPracticeSession,
  deletePracticeSession,
  getExercises,
  getPracticeSessions,
  getSongs,
} from "../../../lib/api";

import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";

type PracticeTargetType =
  | "song"
  | "exercise"
  | "custom";

type PracticeSummary = {
  focus: string;
  durationMinutes: number;
  bpm: number;
  notes: string;

  entityType:
    | "song"
    | "exercise"
    | "custom";

  entityId: number | null;
};

export default function PracticeClient() {
  const searchParams =
    useSearchParams();

  const initializedFromUrl =
    useRef(false);

  const audioContextRef =
    useRef<AudioContext | null>(
      null
    );

  const metronomeIntervalRef =
    useRef<number | null>(
      null
    );

  const [
    sessions,
    setSessions,
  ] =
    useState<
      PracticeSession[]
    >([]);

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
    targetType,
    setTargetType,
  ] =
    useState<PracticeTargetType>(
      "song"
    );

  const [
    selectedTarget,
    setSelectedTarget,
  ] =
    useState("");

  const [
    focus,
    setFocus,
  ] =
    useState("");

  const [
    notes,
    setNotes,
  ] =
    useState("");

  const [
    practiceBpm,
    setPracticeBpm,
  ] =
    useState(80);

  const [
    timerSeconds,
    setTimerSeconds,
  ] =
    useState(0);

  const [
    timerRunning,
    setTimerRunning,
  ] =
    useState(false);

  const [
    metronomeRunning,
    setMetronomeRunning,
  ] =
    useState(false);

  const [
    summary,
    setSummary,
  ] =
    useState<
      PracticeSummary | null
    >(null);

  const [
    updateProgress,
    setUpdateProgress,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    quickFocus,
    setQuickFocus,
  ] =
    useState("");

  const [
    quickMinutes,
    setQuickMinutes,
  ] =
    useState(30);

  const [
    songQuery,
    setSongQuery,
  ] =
    useState("");

  const [
    drillQuery,
    setDrillQuery,
  ] =
    useState("");

  const [
    pendingDelete,
    setPendingDelete,
  ] =
    useState<
      PracticeSession | null
    >(null);

  async function loadData() {
    try {
      const [
        sessionData,
        songData,
        exerciseData,
      ] =
        await Promise.all([
          getPracticeSessions(),
          getSongs(),
          getExercises(),
        ]);

      setSessions(
        sessionData
      );

      setSongs(
        songData
      );

      setExercises(
        exerciseData
      );
    } catch {
      setError(
        "Could not load practice data."
      );
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (
      initializedFromUrl.current
    ) {
      return;
    }

    const type =
      searchParams.get(
        "type"
      );

    const id =
      searchParams.get(
        "id"
      );

    const bpm =
      searchParams.get(
        "bpm"
      );

    const focusParam =
      searchParams.get(
        "focus"
      );

    if (
      type ===
      "custom"
    ) {
      setTargetType(
        "custom"
      );

      setSelectedTarget(
        ""
      );

      setFocus(
        focusParam ||
          "Warm up"
      );

      setPracticeBpm(
        bpm
          ? Number(bpm)
          : 80
      );

      initializedFromUrl.current =
        true;

      return;
    }

    if (
      type ===
        "song" &&
      id &&
      songs.length >
        0
    ) {
      const song =
        songs.find(
          (
            item
          ) =>
            item.id ===
            Number(id)
        );

      if (song) {
        setTargetType(
          "song"
        );

        setSelectedTarget(
          String(
            song.id
          )
        );

        setFocus(
          `${song.title} — ${song.artist}`
        );

        setSongQuery(
          song.title
        );

        setPracticeBpm(
          bpm
            ? Number(bpm)
            : song.current_bpm
        );

        initializedFromUrl.current =
          true;
      }
    }

    if (
      type ===
        "exercise" &&
      id &&
      exercises.length >
        0
    ) {
      const exercise =
        exercises.find(
          (
            item
          ) =>
            item.id ===
            Number(id)
        );

      if (
        exercise
      ) {
        setTargetType(
          "exercise"
        );

        setSelectedTarget(
          String(
            exercise.id
          )
        );

        setFocus(
          exercise.name
        );

        setDrillQuery(
          exercise.name
        );

        setPracticeBpm(
          bpm
            ? Number(bpm)
            : exercise.current_bpm
        );

        initializedFromUrl.current =
          true;
      }
    }
  }, [
    searchParams,
    songs,
    exercises,
  ]);

  useEffect(() => {
    if (
      !timerRunning
    ) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          setTimerSeconds(
            (
              current
            ) =>
              current +
              1
          );
        },
        1000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    timerRunning,
  ]);

  useEffect(() => {
    if (
      !metronomeRunning
    ) {
      stopMetronome();

      return;
    }

    startMetronome();

    return () => {
      stopMetronome();
    };
  }, [
    metronomeRunning,
    practiceBpm,
  ]);

  useEffect(() => {
    return () => {
      stopMetronome();

      if (
        audioContextRef.current &&
        audioContextRef.current
          .state !==
          "closed"
      ) {
        audioContextRef.current.close();
      }
    };
  }, []);

  function stopMetronome() {
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
      !audioContextRef.current
    ) {
      audioContextRef.current =
        new AudioContext();
    }

    const context =
      audioContextRef.current;

    const oscillator =
      context.createOscillator();

    const gain =
      context.createGain();

    oscillator.type =
      "square";

    oscillator.frequency.value =
      950;

    gain.gain.setValueAtTime(
      0.13,
      context.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      context.currentTime +
        0.05
    );

    oscillator.connect(
      gain
    );

    gain.connect(
      context.destination
    );

    oscillator.start();

    oscillator.stop(
      context.currentTime +
        0.06
    );
  }

  function startMetronome() {
    stopMetronome();

    playClick();

    const interval =
      60000 /
      practiceBpm;

    metronomeIntervalRef.current =
      window.setInterval(
        playClick,
        interval
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
      audioContextRef.current
        .state ===
      "suspended"
    ) {
      await audioContextRef.current.resume();
    }

    setMetronomeRunning(
      (
        value
      ) =>
        !value
    );
  }

  function setType(
    type:
      PracticeTargetType
  ) {
    setTargetType(
      type
    );

    setSelectedTarget(
      ""
    );

    setFocus(
      ""
    );

    setMessage(
      ""
    );

    setError(
      ""
    );

    initializedFromUrl.current =
      true;

    if (
      type ===
      "custom"
    ) {
      setPracticeBpm(
        80
      );
    }
  }

  function chooseSong(
    song: Song
  ) {
    setSelectedTarget(
      String(
        song.id
      )
    );

    setSongQuery(
      song.title
    );

    setFocus(
      `${song.title} — ${song.artist}`
    );

    setPracticeBpm(
      song.current_bpm
    );

    setError(
      ""
    );
  }

  function chooseExercise(
    exercise:
      Exercise
  ) {
    setSelectedTarget(
      String(
        exercise.id
      )
    );

    setDrillQuery(
      exercise.name
    );

    setFocus(
      exercise.name
    );

    setPracticeBpm(
      exercise.current_bpm
    );

    setError(
      ""
    );
  }

  function changeBpm(
    amount: number
  ) {
    setPracticeBpm(
      (
        current
      ) =>
        Math.min(
          300,
          Math.max(
            20,
            current +
              amount
          )
        )
    );
  }

  const filteredSongs =
    useMemo(() => {
      const query =
        songQuery
          .trim()
          .toLowerCase();

      if (
        !query
      ) {
        return songs.slice(
          0,
          6
        );
      }

      return songs
        .filter(
          (
            song
          ) =>
            song.title
              .toLowerCase()
              .includes(
                query
              ) ||
            song.artist
              .toLowerCase()
              .includes(
                query
              )
        )
        .slice(
          0,
          8
        );
    }, [
      songs,
      songQuery,
    ]);

  const filteredDrills =
    useMemo(() => {
      const query =
        drillQuery
          .trim()
          .toLowerCase();

      if (
        !query
      ) {
        return exercises.slice(
          0,
          6
        );
      }

      return exercises
        .filter(
          (
            exercise
          ) =>
            exercise.name
              .toLowerCase()
              .includes(
                query
              ) ||
            exercise.category
              .toLowerCase()
              .includes(
                query
              )
        )
        .slice(
          0,
          8
        );
    }, [
      exercises,
      drillQuery,
    ]);

  const timerDisplay =
    useMemo(() => {
      const hours =
        Math.floor(
          timerSeconds /
            3600
        );

      const minutes =
        Math.floor(
          (
            timerSeconds %
            3600
          ) /
            60
        );

      const seconds =
        timerSeconds %
        60;

      return [
        hours,
        minutes,
        seconds,
      ]
        .map(
          (
            value
          ) =>
            String(
              value
            ).padStart(
              2,
              "0"
            )
        )
        .join(
          ":"
        );
    }, [
      timerSeconds,
    ]);

  function toggleTimer() {
    if (
      !focus.trim()
    ) {
      setError(
        "Choose what you want to practice first."
      );

      return;
    }

    setError(
      ""
    );

    setMessage(
      ""
    );

    setTimerRunning(
      (
        running
      ) =>
        !running
    );
  }

  function prepareFinish() {
    if (
      timerSeconds <
      1
    ) {
      return;
    }

    setTimerRunning(
      false
    );

    setMetronomeRunning(
      false
    );

    setSummary({
      focus:
        focus.trim(),

      durationMinutes:
        Math.max(
          1,
          Math.round(
            timerSeconds /
              60
          )
        ),

      bpm:
        practiceBpm,

      notes:
        notes.trim(),

      entityType:
        targetType,

      entityId:
        targetType ===
          "custom" ||
        !selectedTarget
          ? null
          : Number(
              selectedTarget
            ),
    });
  }

  async function saveFinishedSession() {
    if (
      !summary
    ) {
      return;
    }

    setSaving(
      true
    );

    setError(
      ""
    );

    try {
      const result =
        await completePracticeSession(
          {
            duration_minutes:
              summary.durationMinutes,

            focus:
              summary.focus,

            notes:
              summary.notes ||
              null,

            entity_type:
              summary.entityType,

            entity_id:
              summary.entityId,

            bpm:
              summary.bpm,

            update_progress:
              summary.entityType ===
              "custom"
                ? false
                : updateProgress,
          }
        );

      if (
        result.progress_updated &&
        result.previous_bpm !==
          null &&
        result.current_bpm !==
          null
      ) {
        setMessage(
          `Session saved. ${result.previous_bpm} → ${result.current_bpm} BPM.`
        );
      } else {
        setMessage(
          "Session saved."
        );
      }

      setTimerSeconds(
        0
      );

      setNotes(
        ""
      );

      setSummary(
        null
      );

      await loadData();
    } catch (
      error
    ) {
      setError(
        error instanceof
          Error
          ? error.message
          : "Could not save session."
      );
    } finally {
      setSaving(
        false
      );
    }
  }

  function resetSession() {
    setTimerRunning(
      false
    );

    setMetronomeRunning(
      false
    );

    setTimerSeconds(
      0
    );

    setNotes(
      ""
    );

    setMessage(
      ""
    );

    setSummary(
      null
    );
  }

  async function handleQuickLog(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !quickFocus.trim()
    ) {
      return;
    }

    try {
      await createPracticeSession(
        {
          focus:
            quickFocus.trim(),

          duration_minutes:
            quickMinutes,

          notes:
            null,
        }
      );

      setQuickFocus(
        ""
      );

      setQuickMinutes(
        30
      );

      setMessage(
        "Session logged."
      );

      await loadData();
    } catch {
      setError(
        "Could not log session."
      );
    }
  }

  function removeSession(
    session:
      PracticeSession
  ) {
    setPendingDelete(
      session
    );
  }

  async function confirmDeleteSession() {
    if (
      !pendingDelete
    ) {
      return;
    }

    try {
      await deletePracticeSession(
        pendingDelete.id
      );

      setPendingDelete(
        null
      );

      await loadData();
    } catch {
      setError(
        "Could not remove the practice session."
      );
    }
  }

  return (
    <div>
      <Sidebar />

      <main className="ff-page">
        <PageHeader
          eyebrow="PRACTICE"
          title="Practice room"
          description="Choose one thing, set the tempo, and focus on playing."
        />

        <section className="ff-room-layout">
          <article className="ff-panel ff-room-main">
            <div className="ff-practice-type-tabs">
              <button
                type="button"
                className={
                  targetType ===
                  "song"
                    ? "ff-practice-tab ff-practice-tab-active"
                    : "ff-practice-tab"
                }
                onClick={() =>
                  setType(
                    "song"
                  )
                }
              >
                Song
              </button>

              <button
                type="button"
                className={
                  targetType ===
                  "exercise"
                    ? "ff-practice-tab ff-practice-tab-active"
                    : "ff-practice-tab"
                }
                onClick={() =>
                  setType(
                    "exercise"
                  )
                }
              >
                Drill
              </button>

              <button
                type="button"
                className={
                  targetType ===
                  "custom"
                    ? "ff-practice-tab ff-practice-tab-active"
                    : "ff-practice-tab"
                }
                onClick={() =>
                  setType(
                    "custom"
                  )
                }
              >
                Custom
              </button>
            </div>

            {targetType ===
              "song" && (
              <div className="ff-library-picker">
                <input
                  className="ff-input"
                  value={
                    songQuery
                  }
                  onChange={(
                    event
                  ) => {
                    setSongQuery(
                      event
                        .target
                        .value
                    );

                    if (
                      selectedTarget
                    ) {
                      setSelectedTarget(
                        ""
                      );

                      setFocus(
                        ""
                      );
                    }
                  }}
                  placeholder="Search your saved songs..."
                />

                <div className="ff-picker-results">
                  {filteredSongs.map(
                    (
                      song
                    ) => (
                      <button
                        type="button"
                        key={
                          song.id
                        }
                        className={
                          selectedTarget ===
                          String(
                            song.id
                          )
                            ? "ff-picker-result ff-picker-result-active"
                            : "ff-picker-result"
                        }
                        onClick={() =>
                          chooseSong(
                            song
                          )
                        }
                      >
                        <span>
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
                        </span>

                        <span>
                          {
                            song.current_bpm
                          }{" "}
                          BPM
                        </span>
                      </button>
                    )
                  )}

                  {filteredSongs.length ===
                    0 && (
                    <div className="ff-picker-empty">
                      No saved songs
                      match.
                    </div>
                  )}
                </div>
              </div>
            )}

            {targetType ===
              "exercise" && (
              <div className="ff-library-picker">
                <input
                  className="ff-input"
                  value={
                    drillQuery
                  }
                  onChange={(
                    event
                  ) => {
                    setDrillQuery(
                      event
                        .target
                        .value
                    );

                    if (
                      selectedTarget
                    ) {
                      setSelectedTarget(
                        ""
                      );

                      setFocus(
                        ""
                      );
                    }
                  }}
                  placeholder="Search your drills..."
                />

                <div className="ff-picker-results">
                  {filteredDrills.map(
                    (
                      exercise
                    ) => (
                      <button
                        type="button"
                        key={
                          exercise.id
                        }
                        className={
                          selectedTarget ===
                          String(
                            exercise.id
                          )
                            ? "ff-picker-result ff-picker-result-active"
                            : "ff-picker-result"
                        }
                        onClick={() =>
                          chooseExercise(
                            exercise
                          )
                        }
                      >
                        <span>
                          <strong>
                            {
                              exercise.name
                            }
                          </strong>

                          <small>
                            {
                              exercise.category
                            }
                          </small>
                        </span>

                        <span>
                          {
                            exercise.current_bpm
                          }{" "}
                          BPM
                        </span>
                      </button>
                    )
                  )}

                  {filteredDrills.length ===
                    0 && (
                    <div className="ff-picker-empty">
                      No drills match.
                    </div>
                  )}
                </div>
              </div>
            )}

            {targetType ===
              "custom" && (
              <input
                className="ff-input"
                value={
                  focus
                }
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

            <div className="ff-room-session">
              <div className="ff-room-focus">
                <span>
                  CURRENT FOCUS
                </span>

                <strong>
                  {focus ||
                    "Choose something to practice"}
                </strong>
              </div>

              <div className="ff-room-clock">
                {
                  timerDisplay
                }
              </div>

              <div className="ff-room-status">
                <i
                  className={
                    timerRunning
                      ? "ff-live-dot ff-live-dot-active"
                      : "ff-live-dot"
                  }
                />

                {timerRunning
                  ? "Session running"
                  : timerSeconds >
                      0
                    ? "Paused"
                    : "Ready"}
              </div>

              <div className="ff-room-tempo">
                <button
                  type="button"
                  className="ff-button"
                  onClick={() =>
                    changeBpm(
                      -5
                    )
                  }
                >
                  −5
                </button>

                <div>
                  <strong>
                    {
                      practiceBpm
                    }
                  </strong>

                  <span>
                    BPM
                  </span>
                </div>

                <button
                  type="button"
                  className="ff-button"
                  onClick={() =>
                    changeBpm(
                      5
                    )
                  }
                >
                  +5
                </button>
              </div>

              <input
                className="ff-room-range"
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
                className={
                  metronomeRunning
                    ? "ff-metronome-inline ff-metronome-inline-active"
                    : "ff-metronome-inline"
                }
                onClick={
                  toggleMetronome
                }
              >
                <span>
                  ●
                </span>

                Metronome{" "}
                {metronomeRunning
                  ? "On"
                  : "Off"}
              </button>

              <textarea
                className="ff-textarea ff-room-notes"
                value={
                  notes
                }
                onChange={(
                  event
                ) =>
                  setNotes(
                    event
                      .target
                      .value
                  )
                }
                placeholder="Session notes..."
              />

              <div className="ff-room-actions">
                <button
                  className="ff-button ff-button-primary"
                  onClick={
                    toggleTimer
                  }
                >
                  {timerRunning
                    ? "Pause"
                    : timerSeconds >
                        0
                      ? "Resume"
                      : "Start practice"}
                </button>

                {timerSeconds >
                  0 && (
                  <>
                    <button
                      className="ff-button"
                      onClick={
                        prepareFinish
                      }
                    >
                      Finish
                    </button>

                    <button
                      className="ff-button"
                      onClick={
                        resetSession
                      }
                    >
                      Reset
                    </button>
                  </>
                )}
              </div>

              {message && (
                <p className="ff-success-message">
                  {message}
                </p>
              )}

              {error && (
                <p className="ff-form-error ff-room-error">
                  {error}
                </p>
              )}
            </div>
          </article>

          <aside className="ff-room-side">
            <article className="ff-panel">
              <div className="ff-panel-header">
                <div>
                  <h2>
                    Recent sessions
                  </h2>

                  <p>
                    Your latest
                    practice.
                  </p>
                </div>
              </div>

              <div className="ff-session-list">
                {sessions
                  .slice(
                    0,
                    6
                  )
                  .map(
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

                        <span>
                          {
                            session.duration_minutes
                          }{" "}
                          MIN
                        </span>

                        <button
                          type="button"
                          className="ff-icon-button"
                          onClick={() =>
                            removeSession(
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
                  <div className="ff-empty">
                    No practice
                    sessions yet.
                  </div>
                )}
              </div>
            </article>

            <article className="ff-panel">
              <div className="ff-panel-header">
                <div>
                  <h2>
                    Quick log
                  </h2>

                  <p>
                    Log practice you
                    already did.
                  </p>
                </div>
              </div>

              <form
                className="ff-room-quick-log"
                onSubmit={
                  handleQuickLog
                }
              >
                <input
                  className="ff-input"
                  value={
                    quickFocus
                  }
                  onChange={(
                    event
                  ) =>
                    setQuickFocus(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Practice focus"
                />

                <div className="ff-quick-duration">
                  <input
                    className="ff-input"
                    type="number"
                    min="1"
                    value={
                      quickMinutes
                    }
                    onChange={(
                      event
                    ) =>
                      setQuickMinutes(
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

                <button
                  className="ff-button"
                >
                  Log session
                </button>
              </form>
            </article>
          </aside>
        </section>

        {pendingDelete && (
          <div
            className="ff-modal-backdrop"
            onMouseDown={(
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setPendingDelete(
                  null
                );
              }
            }}
          >
            <section className="ff-confirm-modal">
              <div className="ff-confirm-icon">
                ×
              </div>

              <span className="ff-eyebrow">
                REMOVE SESSION
              </span>

              <h2>
                Delete this practice
                session?
              </h2>

              <p>
                <strong>
                  {
                    pendingDelete.focus
                  }
                </strong>
              </p>

              <p className="ff-confirm-description">
                This will remove the
                session from your
                practice history and
                progress totals.
              </p>

              <div className="ff-confirm-actions">
                <button
                  type="button"
                  className="ff-button"
                  onClick={() =>
                    setPendingDelete(
                      null
                    )
                  }
                >
                  Keep session
                </button>

                <button
                  type="button"
                  className="ff-button ff-button-danger"
                  onClick={
                    confirmDeleteSession
                  }
                >
                  Delete session
                </button>
              </div>
            </section>
          </div>
        )}

        {summary && (
          <div className="ff-modal-backdrop">
            <section className="ff-modal">
              <span className="ff-eyebrow">
                SESSION COMPLETE
              </span>

              <h2>
                Nice work.
              </h2>

              <p className="ff-modal-focus">
                {
                  summary.focus
                }
              </p>

              <div className="ff-grid ff-grid-2 ff-modal-stats">
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

              {summary.entityType !==
                "custom" && (
                <label className="ff-progress-checkbox">
                  <input
                    type="checkbox"
                    checked={
                      updateProgress
                    }
                    onChange={(
                      event
                    ) =>
                      setUpdateProgress(
                        event
                          .target
                          .checked
                      )
                    }
                  />

                  Use{" "}
                  {
                    summary.bpm
                  }{" "}
                  BPM as my new
                  current speed
                </label>
              )}

              <div className="ff-modal-actions">
                <button
                  className="ff-button ff-button-primary"
                  onClick={
                    saveFinishedSession
                  }
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Saving..."
                    : "Save session"}
                </button>

                <button
                  className="ff-button"
                  onClick={() =>
                    setSummary(
                      null
                    )
                  }
                >
                  Keep practicing
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}