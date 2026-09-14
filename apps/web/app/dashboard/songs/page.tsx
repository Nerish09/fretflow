"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  Song,
  createSong,
  deleteSong,
  getSongs,
  updateSong,
} from "../../../lib/api";

import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import ProgressBar from "../components/ProgressBar";
import CatalogSearch from "./CatalogSearch";

const difficulties = [
  "Beginner",
  "Intermediate",
  "Advanced",
];

const statuses = [
  "Learning",
  "Practicing",
  "Mastered",
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

export default function SongsPage() {
  const [
    songs,
    setSongs,
  ] =
    useState<Song[]>([]);

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
    title,
    setTitle,
  ] =
    useState("");

  const [
    artist,
    setArtist,
  ] =
    useState("");

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
    difficulty,
    setDifficulty,
  ] =
    useState(
      "Intermediate"
    );

  const [
    status,
    setStatus,
  ] =
    useState(
      "Learning"
    );

  const [
    notes,
    setNotes,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  async function loadSongs() {
    try {
      const data =
        await getSongs();

      setSongs(
        data
      );
    } catch {
      setError(
        "Could not load songs."
      );
    }
  }

  useEffect(() => {
    loadSongs();
  }, []);

  function resetForm() {
    setTitle("");
    setArtist("");
    setCurrentBpm(60);
    setTargetBpm(100);
    setDifficulty(
      "Intermediate"
    );
    setStatus(
      "Learning"
    );
    setNotes("");
    setEditingId(
      null
    );
    setError("");
  }

  function openNewSong() {
    resetForm();
    setShowForm(true);
  }

  function startEdit(
    song: Song
  ) {
    setEditingId(
      song.id
    );

    setTitle(
      song.title
    );

    setArtist(
      song.artist
    );

    setCurrentBpm(
      song.current_bpm
    );

    setTargetBpm(
      song.target_bpm
    );

    setDifficulty(
      song.difficulty
    );

    setStatus(
      song.status
    );

    setNotes(
      song.notes || ""
    );

    setShowForm(
      true
    );

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

    setError("");

    if (
      !title.trim() ||
      !artist.trim()
    ) {
      setError(
        "Song and artist are required."
      );

      return;
    }

    const payload = {
      title:
        title.trim(),

      artist:
        artist.trim(),

      current_bpm:
        currentBpm,

      target_bpm:
        targetBpm,

      difficulty,

      status,

      notes:
        notes.trim() ||
        null,
    };

    try {
      if (
        editingId !==
        null
      ) {
        await updateSong(
          editingId,
          payload
        );
      } else {
        await createSong(
          payload
        );
      }

      resetForm();

      setShowForm(
        false
      );

      await loadSongs();
    } catch (
      error
    ) {
      setError(
        error instanceof
          Error
          ? error.message
          : "Unable to save song."
      );
    }
  }

  async function handleDelete(
    song: Song
  ) {
    if (
      !window.confirm(
        `Remove "${song.title}"?`
      )
    ) {
      return;
    }

    try {
      await deleteSong(
        song.id
      );

      await loadSongs();
    } catch {
      setError(
        "Could not delete song."
      );
    }
  }

  return (
    <div>
      <Sidebar />

      <main className="ff-page">
        <PageHeader
          eyebrow="SONGS"
          title="Your setlist"
          description="Search a large music catalog or manually add songs you want to practice."
          actions={
            <button
              className="ff-button ff-button-primary"
              onClick={
                showForm
                  ? () => {
                      resetForm();

                      setShowForm(
                        false
                      );
                    }
                  : openNewSong
              }
            >
              {showForm
                ? "Close manual form"
                : "+ Add manually"}
            </button>
          }
        />

        <CatalogSearch
          onAdded={
            loadSongs
          }
        />

        {showForm && (
          <section className="ff-panel ff-editor-panel">
            <div className="ff-panel-header">
              <div>
                <h2>
                  {editingId
                    ? "Edit song"
                    : "Add song manually"}
                </h2>

                <p>
                  Use this when a song
                  is not available in
                  search or when you
                  want to enter it
                  yourself.
                </p>
              </div>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="ff-form-grid"
            >
              <label>
                <span>
                  Song
                </span>

                <input
                  className="ff-input"
                  value={
                    title
                  }
                  onChange={(
                    event
                  ) =>
                    setTitle(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Hotel California"
                />
              </label>

              <label>
                <span>
                  Artist
                </span>

                <input
                  className="ff-input"
                  value={
                    artist
                  }
                  onChange={(
                    event
                  ) =>
                    setArtist(
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="Eagles"
                />
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

              <label>
                <span>
                  Difficulty
                </span>

                <select
                  className="ff-select"
                  value={
                    difficulty
                  }
                  onChange={(
                    event
                  ) =>
                    setDifficulty(
                      event
                        .target
                        .value
                    )
                  }
                >
                  {difficulties.map(
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
                  Status
                </span>

                <select
                  className="ff-select"
                  value={
                    status
                  }
                  onChange={(
                    event
                  ) =>
                    setStatus(
                      event
                        .target
                        .value
                    )
                  }
                >
                  {statuses.map(
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
                  placeholder="Sections to work on, chord changes, solo notes..."
                />
              </label>

              {error && (
                <p className="ff-form-error ff-form-full">
                  {error}
                </p>
              )}

              <div className="ff-form-full">
                <button
                  className="ff-button ff-button-primary"
                >
                  {editingId
                    ? "Save changes"
                    : "Add song"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="ff-panel">
          <div className="ff-panel-header">
            <div>
              <h2>
                My songs
              </h2>

              <p>
                {songs.length}{" "}
                {songs.length ===
                1
                  ? "song"
                  : "songs"}{" "}
                in your personal
                library.
              </p>
            </div>
          </div>

          {songs.length >
          0 ? (
            <div className="ff-song-list">
              {songs.map(
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
                      className="ff-song-row"
                    >
                      <div className="ff-song-main">
                        <strong>
                          {
                            song.title
                          }
                        </strong>

                        <small>
                          {
                            song.artist
                          }
                          {" · "}
                          {
                            song.difficulty
                          }
                        </small>
                      </div>

                      <span
                        className={`ff-status ff-status-${song.status
                          .toLowerCase()
                          .replaceAll(
                            " ",
                            "-"
                          )}`}
                      >
                        {
                          song.status
                        }
                      </span>

                      <div className="ff-song-tempo">
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
                      />

                      <div className="ff-row-actions">
                        <button
                          className="ff-button"
                          onClick={() =>
                            startEdit(
                              song
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="ff-icon-button"
                          onClick={() =>
                            handleDelete(
                              song
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
              Search for a song
              above or add one
              manually to create
              your library.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}