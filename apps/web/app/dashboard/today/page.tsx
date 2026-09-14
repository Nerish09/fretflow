"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import ProgressBar from "../components/ProgressBar";
import StatCard from "../components/StatCard";

const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

type QueueItem = {
  type:
    | "song"
    | "exercise"
    | "warmup";

  id:
    | number
    | null;

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
  const router =
    useRouter();

  const [
    minutes,
    setMinutes,
  ] =
    useState(30);

  const [
    queue,
    setQueue,
  ] =
    useState<
      PracticeQueue | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  async function loadQueue(
    requestedMinutes: number
  ) {
    setLoading(
      true
    );

    setError(
      ""
    );

    try {
      const response =
        await fetch(
          `${API_URL}/practice-queue?minutes=${requestedMinutes}`,
          {
            cache:
              "no-store",
          }
        );

      if (
        !response.ok
      ) {
        throw new Error();
      }

      const data =
        await response.json();

      setQueue(
        data
      );
    } catch {
      setError(
        "Could not build your practice plan."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  useEffect(() => {
    loadQueue(
      minutes
    );
  }, [
    minutes,
  ]);

  function startItem(
    item: QueueItem
  ) {
    if (
      item.type ===
      "warmup"
    ) {
      const params =
        new URLSearchParams(
          {
            type:
              "custom",

            focus:
              item.name,

            bpm:
              "80",
          }
        );

      router.push(
        `/dashboard/practice?${params.toString()}`
      );

      return;
    }

    if (
      item.id ===
        null ||
      item.current_bpm ===
        null
    ) {
      return;
    }

    const params =
      new URLSearchParams(
        {
          type:
            item.type,

          id:
            String(
              item.id
            ),

          bpm:
            String(
              item.current_bpm
            ),
        }
      );

    router.push(
      `/dashboard/practice?${params.toString()}`
    );
  }

  function getTypeLabel(
    item: QueueItem
  ) {
    if (
      item.type ===
      "warmup"
    ) {
      return "Warm-up";
    }

    if (
      item.type ===
      "song"
    ) {
      return "Song";
    }

    return "Drill";
  }

  return (
    <div>
      <Sidebar />

      <main className="ff-page">
        <PageHeader
          eyebrow="TODAY"
          title="Your practice plan"
          description="Choose how much time you have. FretFlow fills the session with focused work based on your current songs and drills."
        />

        <section className="ff-duration-picker">
          <div>
            <span className="ff-section-label">
              TIME AVAILABLE
            </span>

            <strong>
              {minutes}
              <small>
                MIN
              </small>
            </strong>
          </div>

          <div className="ff-duration-buttons">
            {durationOptions.map(
              (
                option
              ) => (
                <button
                  key={
                    option
                  }
                  type="button"
                  className={
                    minutes ===
                    option
                      ? "ff-duration-button ff-duration-button-active"
                      : "ff-duration-button"
                  }
                  onClick={() =>
                    setMinutes(
                      option
                    )
                  }
                >
                  {
                    option
                  }
                </button>
              )
            )}
          </div>
        </section>

        {error && (
          <div className="ff-error-box">
            {error}
          </div>
        )}

        <section className="ff-grid ff-grid-3 ff-today-stats">
          <StatCard
            label="Planned"
            value={
              loading
                ? "—"
                : queue
                    ?.planned_minutes ??
                  0
            }
            suffix="MIN"
            detail={`of ${minutes} available`}
            accent
          />

          <StatCard
            label="Blocks"
            value={
              loading
                ? "—"
                : queue
                    ?.items
                    .length ??
                  0
            }
            detail="Focused practice blocks"
          />

          <StatCard
            label="Approach"
            value="Weakest first"
            detail="Prioritizes the biggest skill gaps"
          />
        </section>

        <section className="ff-panel ff-plan-panel">
          <div className="ff-panel-header">
            <div>
              <h2>
                Session plan
              </h2>

              <p>
                Work through these
                in order, or jump
                into any block.
              </p>
            </div>

            {!loading &&
              queue && (
                <span className="ff-plan-total">
                  {
                    queue.planned_minutes
                  }{" "}
                  MIN TOTAL
                </span>
              )}
          </div>

          {loading ? (
            <div className="ff-empty">
              Building your
              session...
            </div>
          ) : queue &&
            queue.items.length >
              0 ? (
            <div className="ff-plan-list">
              {queue.items.map(
                (
                  item,
                  index
                ) => (
                  <article
                    key={`${item.type}-${item.id ?? "none"}-${index}`}
                    className="ff-plan-row"
                  >
                    <div className="ff-plan-index">
                      {String(
                        index +
                          1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </div>

                    <div className="ff-plan-main">
                      <span className="ff-plan-type">
                        {getTypeLabel(
                          item
                        )}
                      </span>

                      <strong>
                        {
                          item.name
                        }
                      </strong>

                      <small>
                        {
                          item.subtitle
                        }
                      </small>
                    </div>

                    <div className="ff-plan-duration">
                      <strong>
                        {
                          item.suggested_minutes
                        }
                      </strong>

                      <span>
                        MIN
                      </span>
                    </div>

                    <div className="ff-plan-tempo">
                      {item.current_bpm !==
                        null &&
                      item.target_bpm !==
                        null ? (
                        <>
                          <span>
                            TEMPO
                          </span>

                          <strong>
                            {
                              item.current_bpm
                            }

                            <small>
                              {" "}
                              →{" "}
                              {
                                item.target_bpm
                              }
                            </small>
                          </strong>
                        </>
                      ) : (
                        <>
                          <span>
                            FOCUS
                          </span>

                          <strong>
                            Prep
                          </strong>
                        </>
                      )}
                    </div>

                    <div className="ff-plan-progress">
                      {item.type ===
                      "warmup" ? (
                        <ProgressBar
                          value={
                            100
                          }
                          label="Ready"
                          showValue={
                            false
                          }
                        />
                      ) : (
                        <ProgressBar
                          value={
                            item.progress
                          }
                          label="Progress"
                        />
                      )}
                    </div>

                    <button
                      type="button"
                      className="ff-button ff-plan-start"
                      onClick={() =>
                        startItem(
                          item
                        )
                      }
                    >
                      Start
                    </button>
                  </article>
                )
              )}
            </div>
          ) : (
            <div className="ff-empty">
              Add a song or drill
              to build your first
              practice plan.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}