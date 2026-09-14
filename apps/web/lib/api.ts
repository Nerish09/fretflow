const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// --------------------
// Songs
// --------------------

export type Song = {
  id: number;
  title: string;
  artist: string;
  current_bpm: number;
  target_bpm: number;
  difficulty: string;
  status: string;
  notes: string | null;
  created_at: string;
};

export type SongInput = {
  title: string;
  artist: string;
  current_bpm: number;
  target_bpm: number;
  difficulty: string;
  status: string;
  notes?: string | null;
};

export async function getSongs(): Promise<Song[]> {
  const response = await fetch(`${API_URL}/songs`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load songs");
  }

  return response.json();
}

export async function createSong(
  data: SongInput
): Promise<Song> {
  const response = await fetch(`${API_URL}/songs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.detail || "Failed to create song"
    );
  }

  return response.json();
}

export async function updateSong(
  songId: number,
  data: Partial<SongInput>
): Promise<Song> {
  const response = await fetch(
    `${API_URL}/songs/${songId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.detail || "Failed to update song"
    );
  }

  return response.json();
}

export async function deleteSong(
  songId: number
): Promise<void> {
  const response = await fetch(
    `${API_URL}/songs/${songId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete song");
  }
}

// --------------------
// Exercises
// --------------------

export type Exercise = {
  id: number;
  name: string;
  category: string;
  current_bpm: number;
  target_bpm: number;
  notes: string | null;
  created_at: string;
};

export type ExerciseInput = {
  name: string;
  category: string;
  current_bpm: number;
  target_bpm: number;
  notes?: string | null;
};

export async function getExercises(): Promise<Exercise[]> {
  const response = await fetch(`${API_URL}/exercises`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load exercises");
  }

  return response.json();
}

export async function createExercise(
  data: ExerciseInput
): Promise<Exercise> {
  const response = await fetch(`${API_URL}/exercises`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.detail || "Failed to create exercise"
    );
  }

  return response.json();
}

export async function updateExercise(
  exerciseId: number,
  data: Partial<ExerciseInput>
): Promise<Exercise> {
  const response = await fetch(
    `${API_URL}/exercises/${exerciseId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.detail || "Failed to update exercise"
    );
  }

  return response.json();
}

export async function deleteExercise(
  exerciseId: number
): Promise<void> {
  const response = await fetch(
    `${API_URL}/exercises/${exerciseId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete exercise");
  }
}

// --------------------
// Practice Sessions
// --------------------

export type PracticeSession = {
  id: number;
  started_at: string;
  duration_minutes: number;
  focus: string;
  notes: string | null;
  created_at: string;
};

export type PracticeSessionInput = {
  duration_minutes: number;
  focus: string;
  notes?: string | null;
  started_at?: string;
};

export type CompletePracticeSessionInput = {
  duration_minutes: number;
  focus: string;
  notes?: string | null;
  started_at?: string;

  entity_type:
    | "song"
    | "exercise"
    | "custom";

  entity_id?: number | null;
  bpm?: number | null;
  update_progress?: boolean;
};

export type CompletePracticeSessionResult = {
  session: PracticeSession;
  progress_updated: boolean;
  previous_bpm: number | null;
  current_bpm: number | null;
};

export async function getPracticeSessions(): Promise<
  PracticeSession[]
> {
  const response = await fetch(
    `${API_URL}/practice-sessions`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load practice sessions");
  }

  return response.json();
}

export async function createPracticeSession(
  data: PracticeSessionInput
): Promise<PracticeSession> {
  const response = await fetch(
    `${API_URL}/practice-sessions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.detail || "Failed to create practice session"
    );
  }

  return response.json();
}

export async function completePracticeSession(
  data: CompletePracticeSessionInput
): Promise<CompletePracticeSessionResult> {
  const response = await fetch(
    `${API_URL}/practice-sessions/complete`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.detail || "Failed to complete practice session"
    );
  }

  return response.json();
}

export async function deletePracticeSession(
  sessionId: number
): Promise<void> {
  const response = await fetch(
    `${API_URL}/practice-sessions/${sessionId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete practice session");
  }
}

// --------------------
// BPM Progress
// --------------------

export type BpmProgressPoint = {
  id: number;
  entity_type: "song" | "exercise";
  entity_id: number;
  bpm: number;
  recorded_at: string;
};

export async function getBpmProgress(
  entityType: "song" | "exercise",
  entityId: number
): Promise<BpmProgressPoint[]> {
  const response = await fetch(
    `${API_URL}/bpm-progress/${entityType}/${entityId}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load BPM progress");
  }

  return response.json();
}

// --------------------
// Practice Goals
// --------------------

export type PracticeGoalProgress = {
  goal_minutes: number;
  completed_minutes: number;
  remaining_minutes: number;
  progress_percent: number;
  completed: boolean;
};

export type PracticeGoals = {
  daily: PracticeGoalProgress;

  weekly: PracticeGoalProgress & {
    window_days: number;
  };

  streaks: {
    current: number;
    longest: number;
    practice_days: number;
  };
};

export async function getPracticeGoals(
  dailyGoal = 30,
  weeklyGoal = 180
): Promise<PracticeGoals> {
  const response = await fetch(
    `${API_URL}/practice-goals?daily_goal=${dailyGoal}&weekly_goal=${weeklyGoal}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load practice goals");
  }

  return response.json();
}