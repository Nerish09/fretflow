"use client";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import Sidebar from "../components/Sidebar";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";


type QueueItem = {
  type:
    | "song"
    | "exercise"
    | "warmup";

  id: number | null;

  name: string;
  subtitle: string;

  current_bpm:
    | number
    | null;

  target_bpm:
    | number
    | null;

  progress: number;

  suggested_minutes: number;
};


type PracticeQueue = {
  requested_minutes: number;
  planned_minutes: number;
  items: QueueItem[];
};


const durationOptions = [
  20,
  30,
  45,
  60,
];


export default function TodayPage() {
  const router = useRouter();

  const [minutes, setMinutes] =
    useState(30);

  const [queue, setQueue] =
    useState<PracticeQueue | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  async function loadQueue(
    requestedMinutes: number
  ) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/practice-queue?minutes=${requestedMinutes}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to build practice queue."
        );
      }

      const data =
        await response.json();

      setQueue(data);
    } catch {
      setError(
        "Could not build today's practice."
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadQueue(minutes);
  }, [minutes]);


  function startItem(
    item: QueueItem
  ) {
    if (
      item.type ===
      "warmup"
    ) {
      const params =
        new URLSearchParams({
          type: "custom",
          focus: item.name,
          bpm: "80",
        });

      router.push(
        `/dashboard/practice?${params.toString()}`
      );

      return;
    }

    if (
      item.id === null ||
      item.current_bpm === null
    ) {
      return;
    }

    const params =
      new URLSearchParams({
        type: item.type,
        id: String(item.id),
        bpm: String(
          item.current_bpm
        ),
      });

    router.push(
      `/dashboard/practice?${params.toString()}`
    );
  }


  function getItemLabel(
    item: QueueItem
  ) {
    if (
      item.type ===
      "warmup"
    ) {
      return "WARM-UP";
    }

    if (
      item.type ===
      "song"
    ) {
      return "SONG";
    }

    return (
      item.subtitle.toUpperCase()
    );
  }


  return (
    <div className="studio-app">
      <Sidebar />

      <main className="studio-page today-page">
        <section className="today-hero">
          <div>
            <p className="studio-kicker">
              TODAY&apos;S PRACTICE
            </p>

            <h1>
              Pick up.
              <br />
              Plug in.
              <br />
              Play.
            </h1>

            <p>
              FretFlow builds a focused
              session from the songs and
              drills that need the most
              attention.
            </p>
          </div>

          <div className="today-duration-panel">
            <span>
              I HAVE
            </span>

            <strong>
              {minutes}
              <small>
                MIN
              </small>
            </strong>

            <div className="today-duration-options">
              {durationOptions.map(
                (option) => (
                  <button
                    key={option}
                    className={
                      minutes ===
                      option
                        ? "today-duration-active"
                        : ""
                    }
                    onClick={() =>
                      setMinutes(
                        option
                      )
                    }
                  >
                    {option}
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        <section className="today-summary-strip">
          <div>
            <span>
              PLANNED
            </span>

            <strong>
              {loading
                ? "—"
                : queue
                    ?.planned_minutes ??
                  0}

              <small>
                {" "}MIN
              </small>
            </strong>
          </div>

          <div>
            <span>
              ITEMS
            </span>

            <strong>
              {loading
                ? "—"
                : queue?.items
                    .length ?? 0}
            </strong>
          </div>

          <div>
            <span>
              STRATEGY
            </span>

            <strong>
              Weakest first
            </strong>
          </div>
        </section>

        {error && (
          <div className="today-error">
            {error}
          </div>
        )}

        <section className="today-queue-section">
          <div className="today-section-heading">
            <div>
              <p className="studio-kicker">
                SESSION QUEUE
              </p>

              <h2>
                Today&apos;s work.
              </h2>
            </div>

            <p>
              Balanced to fill your
              available time.
            </p>
          </div>

          {loading ? (
            <div className="today-loading">
              Building your
              session...
            </div>
          ) : queue &&
            queue.items.length >
              0 ? (
            <div className="today-queue">
              {queue.items.map(
                (
                  item,
                  index
                ) => (
                  <article
                    key={`${item.type}-${item.id ?? "none"}-${index}`}
                    className={
                      item.type ===
                      "warmup"
                        ? "today-queue-item today-queue-item-warmup"
                        : "today-queue-item"
                    }
                  >
                    <span className="today-item-number">
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <div className="today-item-main">
                      <span>
                        {getItemLabel(
                          item
                        )}
                      </span>

                      <h2>
                        {
                          item.name
                        }
                      </h2>

                      <p>
                        {
                          item.subtitle
                        }
                      </p>
                    </div>

                    <div className="today-time">
                      <strong>
                        {
                          item.suggested_minutes
                        }
                      </strong>

                      <span>
                        MIN
                      </span>
                    </div>

                    {item.current_bpm !==
                      null &&
                    item.target_bpm !==
                      null ? (
                      <div className="today-bpm">
                        <span>
                          TEMPO
                        </span>

                        <div>
                          <strong>
                            {
                              item.current_bpm
                            }
                          </strong>

                          <small>
                            →{" "}
                            {
                              item.target_bpm
                            }{" "}
                            BPM
                          </small>
                        </div>
                      </div>
                    ) : (
                      <div className="today-bpm">
                        <span>
                          FOCUS
                        </span>

                        <div>
                          <strong>
                            —
                          </strong>

                          <small>
                            Get loose
                          </small>
                        </div>
                      </div>
                    )}

                    {item.type !==
                    "warmup" ? (
                      <div className="today-progress">
                        <div>
                          <span
                            style={{
                              width: `${item.progress}%`,
                            }}
                          />
                        </div>

                        <small>
                          {
                            item.progress
                          }
                          %
                        </small>
                      </div>
                    ) : (
                      <div className="today-progress today-progress-warmup">
                        <div>
                          <span
                            style={{
                              width:
                                "100%",
                            }}
                          />
                        </div>

                        <small>
                          READY
                        </small>
                      </div>
                    )}

                    <button
                      className="today-start-button"
                      onClick={() =>
                        startItem(
                          item
                        )
                      }
                    >
                      START
                      <span>
                        →
                      </span>
                    </button>
                  </article>
                )
              )}
            </div>
          ) : (
            <div className="today-empty">
              <span>
                ♪
              </span>

              <h2>
                Nothing to queue
                yet.
              </h2>

              <p>
                Add some songs or
                drills and FretFlow
                will build your
                practice session.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}