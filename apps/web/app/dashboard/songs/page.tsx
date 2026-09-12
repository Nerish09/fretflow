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

export default function SongsPage() {
  const [songs, setSongs] =
    useState<Song[]>([]);

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [title, setTitle] =
    useState("");

  const [artist, setArtist] =
    useState("");

  const [currentBpm, setCurrentBpm] =
    useState(60);

  const [targetBpm, setTargetBpm] =
    useState(100);

  const [difficulty, setDifficulty] =
    useState("Intermediate");

  const [status, setStatus] =
    useState("Learning");

  const [notes, setNotes] =
    useState("");

  const [error, setError] =
    useState("");

  async function loadSongs() {
    try {
      setSongs(await getSongs());
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
    setDifficulty("Intermediate");
    setStatus("Learning");
    setNotes("");
    setEditingId(null);
    setError("");
  }

  function openNewSong() {
    resetForm();
    setShowForm(true);
  }

  function startEdit(song: Song) {
    setEditingId(song.id);
    setTitle(song.title);
    setArtist(song.artist);
    setCurrentBpm(
      song.current_bpm
    );
    setTargetBpm(
      song.target_bpm
    );
    setDifficulty(
      song.difficulty
    );
    setStatus(song.status);
    setNotes(song.notes || "");
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
      title: title.trim(),
      artist: artist.trim(),
      current_bpm:
        currentBpm,
      target_bpm:
        targetBpm,
      difficulty,
      status,
      notes:
        notes.trim() || null,
    };

    try {
      if (editingId !== null) {
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
      setShowForm(false);

      await loadSongs();
    } catch (error) {
      setError(
        error instanceof Error
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
        `Remove "${song.title}" from your setlist?`
      )
    ) {
      return;
    }

    await deleteSong(song.id);

    await loadSongs();
  }

  return (
    <div className="studio-app">
      <Sidebar />

      <main className="studio-page">
        <section className="setlist-hero">
          <div>
            <p className="studio-kicker">
              YOUR SETLIST
            </p>

            <h1>
              Songs worth
              <br />
              finishing.
            </h1>
          </div>

          <div className="setlist-hero-side">
            <p>
              Track each song from the
              first rough run to
              performance speed.
            </p>

            <button
              className="studio-action-button"
              onClick={
                showForm
                  ? () => {
                      resetForm();
                      setShowForm(false);
                    }
                  : openNewSong
              }
            >
              {showForm
                ? "Close editor"
                : "+ Add to setlist"}
            </button>
          </div>
        </section>

        {showForm && (
          <section className="studio-editor">
            <div className="studio-editor-heading">
              <div>
                <span>
                  {editingId
                    ? "EDITING"
                    : "NEW TRACK"}
                </span>

                <h2>
                  {editingId
                    ? title ||
                      "Edit song"
                    : "Add a song"}
                </h2>
              </div>

              <p>
                Your speed targets should
                feel challenging but
                realistic.
              </p>
            </div>

            <form
              className="studio-song-form"
              onSubmit={handleSubmit}
            >
              <label>
                <span>SONG</span>

                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  placeholder="Hotel California"
                />
              </label>

              <label>
                <span>ARTIST</span>

                <input
                  value={artist}
                  onChange={(event) =>
                    setArtist(
                      event.target.value
                    )
                  }
                  placeholder="Eagles"
                />
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

                <div>→</div>

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

              <label>
                <span>DIFFICULTY</span>

                <select
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(
                      event.target.value
                    )
                  }
                >
                  {difficulties.map(
                    (item) => (
                      <option
                        key={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                <span>STATUS</span>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value
                    )
                  }
                >
                  {statuses.map(
                    (item) => (
                      <option
                        key={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="studio-form-notes">
                <span>NOTES</span>

                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(
                      event.target.value
                    )
                  }
                  placeholder="Solo timing, chord transitions, tricky sections..."
                />
              </label>

              {error && (
                <p className="studio-error">
                  {error}
                </p>
              )}

              <button className="studio-save-button">
                {editingId
                  ? "Save changes"
                  : "Add song"}
              </button>
            </form>
          </section>
        )}

        <section className="setlist-table">
          <div className="setlist-heading-row">
            <span>#</span>
            <span>TRACK</span>
            <span>STATUS</span>
            <span>SPEED</span>
            <span>PROGRESS</span>
            <span />
          </div>

          {songs.map(
            (song, index) => {
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
                  className="setlist-item"
                  key={song.id}
                >
                  <span className="setlist-index">
                    {String(
                      index + 1
                    ).padStart(
                      2,
                      "0"
                    )}
                  </span>

                  <div className="setlist-song-name">
                    <strong>
                      {song.title}
                    </strong>

                    <span>
                      {song.artist}
                      {" · "}
                      {
                        song.difficulty
                      }
                    </span>
                  </div>

                  <span
                    className={`setlist-status setlist-status-${song.status
                      .toLowerCase()
                      .replaceAll(
                        " ",
                        "-"
                      )}`}
                  >
                    {song.status}
                  </span>

                  <div className="setlist-speed">
                    <strong>
                      {
                        song.current_bpm
                      }
                    </strong>

                    <span>
                      /{" "}
                      {
                        song.target_bpm
                      }
                    </span>

                    <small>BPM</small>
                  </div>

                  <div className="setlist-progress">
                    <div>
                      <span
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>

                    <small>
                      {progress}%
                    </small>
                  </div>

                  <div className="setlist-actions">
                    <button
                      onClick={() =>
                        startEdit(
                          song
                        )
                      }
                    >
                      EDIT
                    </button>

                    <button
                      className="setlist-remove"
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

          {songs.length === 0 && (
            <div className="setlist-empty">
              <span>♪</span>

              <h2>
                Nothing on the setlist.
              </h2>

              <p>
                Add the first song
                you&apos;re working on.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}