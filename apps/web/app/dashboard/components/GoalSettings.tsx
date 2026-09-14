"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  getPracticeGoalSettings,
  savePracticeGoalSettings,
} from "../../../lib/settings/practiceGoals";

type GoalSettingsProps = {
  onSaved?: () => void;
};

export default function GoalSettings({
  onSaved,
}: GoalSettingsProps) {
  const current =
    getPracticeGoalSettings();

  const [
    daily,
    setDaily,
  ] =
    useState(
      current.dailyMinutes
    );

  const [
    weekly,
    setWeekly,
  ] =
    useState(
      current.weeklyMinutes
    );

  const [
    saved,
    setSaved,
  ] =
    useState(false);

  function submit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    savePracticeGoalSettings({
      dailyMinutes:
        daily,

      weeklyMinutes:
        weekly,
    });

    setSaved(
      true
    );

    onSaved?.();

    window.setTimeout(
      () =>
        setSaved(
          false
        ),
      1500
    );
  }

  return (
    <form
      className="ff-goal-settings"
      onSubmit={
        submit
      }
    >
      <label>
        <span>
          DAILY
        </span>

        <div>
          <input
            className="ff-input"
            type="number"
            min="1"
            max="480"
            value={
              daily
            }
            onChange={(
              event
            ) =>
              setDaily(
                Number(
                  event
                    .target
                    .value
                )
              )
            }
          />

          <small>
            MIN
          </small>
        </div>
      </label>

      <label>
        <span>
          7 DAYS
        </span>

        <div>
          <input
            className="ff-input"
            type="number"
            min="1"
            max="3360"
            value={
              weekly
            }
            onChange={(
              event
            ) =>
              setWeekly(
                Number(
                  event
                    .target
                    .value
                )
              )
            }
          />

          <small>
            MIN
          </small>
        </div>
      </label>

      <button
        className="ff-button"
      >
        {saved
          ? "Saved ✓"
          : "Save goals"}
      </button>
    </form>
  );
}