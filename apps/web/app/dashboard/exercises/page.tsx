"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  Exercise,
  createExercise,
  deleteExercise,
  getExercises,
  updateExercise,
} from "../../../lib/api";

import Sidebar from "../components/Sidebar";

const categories = [
  "Technique",
  "Scales",
  "Chords",
  "Warm-up",
  "Rhythm",
  "Improvisation",
];

export default function ExercisesPage() {
  const [
    exercises,
    setExercises,
  ] = useState<Exercise[]>([]);

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [name, setName] =
    useState("");

  const [category, setCategory] =
    useState("Technique");

  const [currentBpm, setCurrentBpm] =
    useState(60);

  const [targetBpm, setTargetBpm] =
    useState(100);

  const [notes, setNotes] =
    useState("");

  async function loadExercises() {
    setExercises(
      await getExercises()
    );
  }

  useEffect(() => {
    loadExercises();
  }, []);

  function resetForm() {
    setName("");
    setCategory("Technique");
    setCurrentBpm(60);
    setTargetBpm(100);
    setNotes("");
    setEditingId(null);
  }

  function startEdit(
    exercise: Exercise
  ) {
    setEditingId(exercise.id);
    setName(exercise.name);
    setCategory(
      exercise.category
    );
    setCurrentBpm(
      exercise.current_bpm
    );
    setTargetBpm(
      exercise.target_bpm
    );
    setNotes(
      exercise.notes || ""
    );

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const payload = {
      name: name.trim(),
      category,
      current_bpm:
        currentBpm,
      target_bpm:
        targetBpm,
      notes:
        notes.trim() || null,
    };

    if (editingId !== null) {
      await updateExercise(
        editingId,
        payload
      );
    } else {
      await createExercise(
        payload
      );
    }

    resetForm();
    setShowForm(false);

    await loadExercises();
  }

  async function handleDelete(
    exercise: Exercise
  ) {
    if (
      !window.confirm(
        `Remove "${exercise.name}"?`
      )
    ) {
      return;
    }

    await deleteExercise(
      exercise.id
    );

    await loadExercises();
  }

  return (
    <div className="studio-app">
      <Sidebar />

      <main className="studio-page">
        <section className="drill-hero">
          <div>
            <p className="studio-kicker">
              TECHNIQUE RACK
            </p>

            <h1>
              Build cleaner.
              <br />
              Play faster.
            </h1>
          </div>

          <button
            className="studio-action-button"
            onClick={() => {
              if (showForm) {
                resetForm();
              }

              setShowForm(
                !showForm
              );
            }}
          >
            {showForm
              ? "Close editor"
              : "+ New drill"}
          </button>
        </section>

        {showForm && (
          <section className="studio-editor">
            <div className="studio-editor-heading">
              <div>
                <span>
                  {editingId
                    ? "EDITING DRILL"
                    : "NEW DRILL"}
                </span>

                <h2>
                  {editingId
                    ? name
                    : "Add an exercise"}
                </h2>
              </div>
            </div>

            <form
              className="studio-song-form"
              onSubmit={
                handleSubmit
              }
            >
              <label>
                <span>
                  EXERCISE
                </span>

                <input
                  required
                  value={name}
                  onChange={(
                    event
                  ) =>
                    setName(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Alternate Picking"
                />
              </label>

              <label>
                <span>
                  CATEGORY
                </span>

                <select
                  value={category}
                  onChange={(
                    event
                  ) =>
                    setCategory(
                      event
                        .target
                        .value
                    )
                  }
                >
                  {categories.map(
                    (item) => (
                      <option
                        key={
                          item
                        }
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </label>

              <div className="studio-bpm-editor">
                <label>
                  <span>
                    CURRENT BPM
                  </span>

                  <input
                    type="number"
                    min="20"
                    max="300"
                    value={
                      currentBpm
                    }
                    onChange={(
                      event
                    ) =>
                      setCurrentBpm(
                        Number(
                          event
                            .target
                            .value
                        )
                      )
                    }
                  />
                </label>

                <div>
                  →
                </div>

                <label>
                  <span>
                    TARGET BPM
                  </span>

                  <input
                    type="number"
                    min="20"
                    max="300"
                    value={
                      targetBpm
                    }
                    onChange={(
                      event
                    ) =>
                      setTargetBpm(
                        Number(
                          event
                            .target
                            .value
                        )
                      )
                    }
                  />
                </label>
              </div>

              <label className="studio-form-notes">
                <span>
                  NOTES
                </span>

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
                  placeholder="Keep your wrist loose and focus on even attack..."
                />
              </label>

              <button className="studio-save-button">
                {editingId
                  ? "Save drill"
                  : "Add drill"}
              </button>
            </form>
          </section>
        )}

        <section className="drill-rack">
          {exercises.map(
            (
              exercise,
              index
            ) => {
              const progress =
                Math.min(
                  100,
                  Math.round(
                    (exercise.current_bpm /
                      exercise.target_bpm) *
                      100
                  )
                );

              return (
                <article
                  className="drill-module"
                  key={
                    exercise.id
                  }
                >
                  <div className="drill-module-number">
                    {String(
                      index + 1
                    ).padStart(
                      2,
                      "0"
                    )}
                  </div>

                  <div className="drill-module-info">
                    <span>
                      {
                        exercise.category
                      }
                    </span>

                    <h2>
                      {
                        exercise.name
                      }
                    </h2>

                    <p>
                      {exercise.notes ||
                        "No notes added."}
                    </p>
                  </div>

                  <div className="drill-dial">
                    <span>
                      CURRENT
                    </span>

                    <strong>
                      {
                        exercise.current_bpm
                      }
                    </strong>

                    <small>
                      BPM
                    </small>
                  </div>

                  <div className="drill-dial drill-dial-target">
                    <span>
                      TARGET
                    </span>

                    <strong>
                      {
                        exercise.target_bpm
                      }
                    </strong>

                    <small>
                      BPM
                    </small>
                  </div>

                  <div className="drill-meter">
                    <div>
                      <span
                        style={{
                          height: `${progress}%`,
                        }}
                      />
                    </div>

                    <small>
                      {progress}%
                    </small>
                  </div>

                  <div className="drill-controls">
                    <button
                      onClick={() =>
                        startEdit(
                          exercise
                        )
                      }
                    >
                      EDIT
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(
                          exercise
                        )
                      }
                    >
                      REMOVE
                    </button>
                  </div>
                </article>
              );
            }
          )}

          {exercises.length ===
            0 &&
            !showForm && (
              <div className="setlist-empty">
                <span>⌁</span>

                <h2>
                  Your rack is empty.
                </h2>

                <p>
                  Add a scale,
                  technique, rhythm
                  drill, or warm-up.
                </p>
              </div>
            )}
        </section>
      </main>
    </div>
  );
}