"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  CatalogSong,
  SongInput,
  createSong,
  searchSongCatalog,
} from "../../../lib/api";

type CatalogSearchProps = {
  onAdded: () => void;
};

export default function CatalogSearch({
  onAdded,
}: CatalogSearchProps) {
  const [query, setQuery] =
    useState("");

  const [
    results,
    setResults,
  ] =
    useState<CatalogSong[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    selected,
    setSelected,
  ] =
    useState<CatalogSong | null>(
      null
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
    adding,
    setAdding,
  ] =
    useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");

  async function handleSearch(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleaned =
      query.trim();

    if (
      cleaned.length < 2
    ) {
      setError(
        "Enter at least 2 characters."
      );

      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const data =
        await searchSongCatalog(
          cleaned,
          12
        );

      setResults(
        data.results
      );

      if (
        data.results.length ===
        0
      ) {
        setError(
          "No songs found."
        );
      }
    } catch (
      error
    ) {
      setError(
        error instanceof Error
          ? error.message
          : "Search failed."
      );
    } finally {
      setLoading(false);
    }
  }

  function openAddModal(
    song: CatalogSong
  ) {
    setSelected(song);

    setCurrentBpm(60);
    setTargetBpm(100);

    setDifficulty(
      "Intermediate"
    );

    setStatus(
      "Learning"
    );

    setNotes("");
    setError("");
  }

  function closeAddModal() {
    if (adding) {
      return;
    }

    setSelected(null);
  }

  async function addSelected() {
    if (!selected) {
      return;
    }

    if (
      currentBpm < 20 ||
      targetBpm < 20
    ) {
      setError(
        "BPM must be at least 20."
      );

      return;
    }

    const payload: SongInput = {
      title:
        selected.title,

      artist:
        selected.artist,

      current_bpm:
        currentBpm,

      target_bpm:
        targetBpm,

      difficulty,

      status,

      notes:
        notes.trim() || null,
    };

    setAdding(true);
    setError("");

    try {
      await createSong(
        payload
      );

      const name =
        `${selected.title} — ${selected.artist}`;

      setSelected(null);

      setSuccessMessage(
        `${name} added to your songs.`
      );

      await onAdded();
    } catch (
      error
    ) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not add song."
      );
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <section className="ff-panel ff-catalog-panel">
        <div className="ff-panel-header">
          <div>
            <h2>
              Find a song
            </h2>

            <p>
              Search the music
              catalog, then add it
              to your personal
              FretFlow library.
            </p>
          </div>
        </div>

        <form
          className="ff-catalog-search"
          onSubmit={
            handleSearch
          }
        >
          <input
            className="ff-input"
            value={query}
            onChange={(
              event
            ) =>
              setQuery(
                event.target.value
              )
            }
            placeholder="Search by song or artist..."
          />

          <button
            type="submit"
            className="ff-button ff-button-primary"
            disabled={
              loading
            }
          >
            {loading
              ? "Searching..."
              : "Search"}
          </button>
        </form>

        {successMessage && (
          <p className="ff-catalog-success">
            {successMessage}
          </p>
        )}

        {error &&
          !selected && (
            <p className="ff-form-error ff-catalog-error">
              {error}
            </p>
          )}

        {results.length >
          0 && (
          <div className="ff-catalog-results">
            {results.map(
              (
                result
              ) => (
                <article
                  key={
                    result.id
                  }
                  className="ff-catalog-result"
                >
                  <div>
                    <strong>
                      {
                        result.title
                      }
                    </strong>

                    <span>
                      {
                        result.artist
                      }
                    </span>

                    <small>
                      {result.release ||
                        "Unknown release"}

                      {result.release_date
                        ? ` · ${result.release_date}`
                        : ""}
                    </small>
                  </div>

                  <button
                    type="button"
                    className="ff-button"
                    onClick={() =>
                      openAddModal(
                        result
                      )
                    }
                  >
                    Add
                  </button>
                </article>
              )
            )}
          </div>
        )}
      </section>

      {selected && (
        <div
          className="ff-catalog-modal-backdrop"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeAddModal();
            }
          }}
        >
          <section className="ff-catalog-modal">
            <div className="ff-catalog-modal-header">
              <div>
                <span className="ff-eyebrow">
                  ADD TO LIBRARY
                </span>

                <h2>
                  {
                    selected.title
                  }
                </h2>

                <p>
                  {
                    selected.artist
                  }
                </p>
              </div>

              <button
                type="button"
                className="ff-icon-button"
                onClick={
                  closeAddModal
                }
                disabled={
                  adding
                }
              >
                ×
              </button>
            </div>

            {(selected.release ||
              selected.release_date) && (
              <div className="ff-catalog-release">
                <span>
                  RELEASE
                </span>

                <strong>
                  {selected.release ||
                    "Unknown"}

                  {selected.release_date
                    ? ` · ${selected.release_date}`
                    : ""}
                </strong>
              </div>
            )}

            <div className="ff-form-grid">
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
                  <option>
                    Beginner
                  </option>

                  <option>
                    Intermediate
                  </option>

                  <option>
                    Advanced
                  </option>
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
                  <option>
                    Learning
                  </option>

                  <option>
                    Practicing
                  </option>

                  <option>
                    Mastered
                  </option>
                </select>
              </label>

              <label className="ff-form-full">
                <span>
                  Notes
                </span>

                <textarea
                  className="ff-textarea"
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
                  placeholder="Solo, chord changes, sections to practice..."
                />
              </label>
            </div>

            {error && (
              <p className="ff-form-error ff-catalog-modal-error">
                {error}
              </p>
            )}

            <div className="ff-catalog-modal-actions">
              <button
                type="button"
                className="ff-button"
                onClick={
                  closeAddModal
                }
                disabled={
                  adding
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="ff-button ff-button-primary"
                onClick={
                  addSelected
                }
                disabled={
                  adding
                }
              >
                {adding
                  ? "Adding..."
                  : "Add to my songs"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}