export type PracticeGoalSettings = {
  dailyMinutes: number;
  weeklyMinutes: number;
};

const STORAGE_KEY =
  "fretflow-practice-goals";

export const DEFAULT_PRACTICE_GOALS: PracticeGoalSettings = {
  dailyMinutes: 30,
  weeklyMinutes: 180,
};

export function getPracticeGoalSettings(): PracticeGoalSettings {
  if (
    typeof window ===
    "undefined"
  ) {
    return DEFAULT_PRACTICE_GOALS;
  }

  try {
    const stored =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (!stored) {
      return DEFAULT_PRACTICE_GOALS;
    }

    const parsed =
      JSON.parse(stored);

    const dailyMinutes =
      Number(
        parsed.dailyMinutes
      );

    const weeklyMinutes =
      Number(
        parsed.weeklyMinutes
      );

    if (
      !Number.isFinite(
        dailyMinutes
      ) ||
      !Number.isFinite(
        weeklyMinutes
      )
    ) {
      return DEFAULT_PRACTICE_GOALS;
    }

    return {
      dailyMinutes:
        Math.min(
          480,
          Math.max(
            1,
            dailyMinutes
          )
        ),

      weeklyMinutes:
        Math.min(
          3360,
          Math.max(
            1,
            weeklyMinutes
          )
        ),
    };
  } catch {
    return DEFAULT_PRACTICE_GOALS;
  }
}

export function savePracticeGoalSettings(
  settings: PracticeGoalSettings
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  const normalized: PracticeGoalSettings = {
    dailyMinutes:
      Math.min(
        480,
        Math.max(
          1,
          Number(
            settings.dailyMinutes
          )
        )
      ),

    weeklyMinutes:
      Math.min(
        3360,
        Math.max(
          1,
          Number(
            settings.weeklyMinutes
          )
        )
      ),
  };

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      normalized
    )
  );
}