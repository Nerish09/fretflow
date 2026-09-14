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
import PageHeader from "../components/PageHeader";
import ProgressBar from "../components/ProgressBar";

const categories = [
  "Technique",
  "Scales",
  "Chords",
  "Warm-up",
  "Rhythm",
  "Improvisation",
];

function calculateProgress(
  current: number,
  target: number
) {
  if (
    target <= 0
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      (current / target) *
        100
    )
  );
}

export default function ExercisesPage() {
  const [
    exercises,
    setExercises,
  ] =
    useState<
      Exercise[]
    >([]);

  const [
    showForm,
    setShowForm,
  ] =
    useState(false);

  const [
    editingId,
    setEditingId,
  ] =
    useState<
      number | null
    >(null);

  const [
    name,
    setName,
  ] =
    useState("");

  const [
    category,
    setCategory,
  ] =
    useState(
      "Technique"
    );

  const [
    currentBpm,
    setCurrentBpm,
  ] =
    useState(60);

  const [
    targetBpm,
    setTargetBpm,
  ] =
    useState(100);

  const [
    notes,
    setNotes,
  ] =
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
    setCategory(
      "Technique"
    );
    setCurrentBpm(60);
    setTargetBpm(100);
    setNotes("");
    setEditingId(
      null
    );
  }

  function startEdit(
    exercise:
      Exercise
  ) {
    setEditingId(
      exercise.id
    );

    setName(
      exercise.name
    );

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
      behavior:
        "smooth",
    });
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const payload = {
      name:
        name.trim(),

      category,

      current_bpm:
        currentBpm,

      target_bpm:
        targetBpm,

      notes:
        notes.trim() ||
        null,
    };

    if (
      editingId !==
      null
    ) {
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
    exercise:
      Exercise
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
    <div>
      <Sidebar />

      <main className="ff-page">
        <PageHeader
          eyebrow="DRILLS"
          title="Technique library"
          description="Keep your warm-ups, exercises and technique work organized in one place."
          actions={
            <button
              className="ff-button ff-button-primary"
              onClick={() => {
                if (
                  showForm
                ) {
                  resetForm();
                }

                setShowForm(
                  !showForm
                );
              }}
            >
              {showForm
                ? "Close"
                : "+ Add drill"}
            </button>
          }
        />

        {showForm && (
          <section className="ff-panel ff-editor-panel">
            <div className="ff-panel-header">
              <div>
                <h2>
                  {editingId
                    ? "Edit drill"
                    : "Add drill"}
                </h2>

                <p>
                  Track technique
                  work just like a
                  song.
                </p>
              </div>
            </div>

            <form
              className="ff-form-grid"
              onSubmit={
                handleSubmit
              }
            >
              <label>
                <span>
                  Exercise
                </span>

                <input
                  className="ff-input"
                  required
                  value={
                    name
                  }
                  onChange={(
                    event
                  ) =>
                    setName(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Alternate picking"
                />
              </label>

              <label>
                <span>
                  Category
                </span>

                <select
                  className="ff-select"
                  value={
                    category
                  }
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
                    (
                      item
                    ) => (
                      <option
                        key={
                          item
                        }
                      >
                        {
                          item
                        }
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                <span>
                  Current BPM
                </span>

                <input
                  className="ff-input"
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

              <label>
                <span>
                  Target BPM
                </span>

                <input
                  className="ff-input"
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

              <label className="ff-form-full">
                <span>
                  Notes
                </span>

                <textarea
                  className="ff-textarea"
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
                  placeholder="Technique cues, picking pattern, timing..."
                />
              </label>

              <div className="ff-form-full">
                <button
                  className="ff-button ff-button-primary"
                >
                  {editingId
                    ? "Save changes"
                    : "Add drill"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="ff-panel">
          <div className="ff-panel-header">
            <div>
              <h2>
                Drills
              </h2>

              <p>
                {
                  exercises.length
                }{" "}
                total
              </p>
            </div>
          </div>

          {exercises.length >
          0 ? (
            <div className="ff-drill-list">
              {exercises.map(
                (
                  exercise
                ) => {
                  const progress =
                    calculateProgress(
                      exercise.current_bpm,
                      exercise.target_bpm
                    );

                  return (
                    <article
                      key={
                        exercise.id
                      }
                      className="ff-drill-row"
                    >
                      <div className="ff-drill-main">
                        <span>
                          {
                            exercise.category
                          }
                        </span>

                        <strong>
                          {
                            exercise.name
                          }
                        </strong>

                        {exercise.notes && (
                          <small>
                            {
                              exercise.notes
                            }
                          </small>
                        )}
                      </div>

                      <div className="ff-drill-tempo">
                        <strong>
                          {
                            exercise.current_bpm
                          }
                        </strong>

                        <small>
                          →{" "}
                          {
                            exercise.target_bpm
                          }{" "}
                          BPM
                        </small>
                      </div>

                      <ProgressBar
                        value={
                          progress
                        }
                      />

                      <div className="ff-row-actions">
                        <button
                          className="ff-button"
                          onClick={() =>
                            startEdit(
                              exercise
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="ff-icon-button"
                          onClick={() =>
                            handleDelete(
                              exercise
                            )
                          }
                        >
                          ×
                        </button>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          ) : (
            <div className="ff-empty">
              Add a drill to
              start building your
              technique library.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}