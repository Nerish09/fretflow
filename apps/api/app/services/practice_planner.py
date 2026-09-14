def build_practice_plan(requested_minutes: int, songs: list, exercises: list):
    """
    Build a practice plan that fills the requested session duration.
    """

    if requested_minutes <= 0:
        return []

    plan = []
    remaining = requested_minutes

    # Warm-up
    warmup_minutes = min(5, remaining)

    if warmup_minutes > 0:
        plan.append({
            "type": "warmup",
            "title": "Warm up",
            "duration_minutes": warmup_minutes,
        })
        remaining -= warmup_minutes

    # Prioritize songs with the largest BPM gap
    prioritized_songs = sorted(
        songs,
        key=lambda song: (
            song.target_bpm - song.current_bpm
        ),
        reverse=True,
    )

    # Add song practice
    for song in prioritized_songs:
        if remaining <= 0:
            break

        duration = min(10, remaining)

        plan.append({
            "type": "song",
            "id": song.id,
            "title": song.title,
            "duration_minutes": duration,
            "current_bpm": song.current_bpm,
            "target_bpm": song.target_bpm,
        })

        remaining -= duration

    # Add exercises
    for exercise in exercises:
        if remaining <= 0:
            break

        duration = min(5, remaining)

        plan.append({
            "type": "exercise",
            "id": exercise.id,
            "title": exercise.name,
            "duration_minutes": duration,
        })

        remaining -= duration

    # If time remains, repeat weakest song
    song_index = 0

    while remaining > 0 and prioritized_songs:
        song = prioritized_songs[
            song_index % len(prioritized_songs)
        ]

        duration = min(5, remaining)

        plan.append({
            "type": "song",
            "id": song.id,
            "title": song.title,
            "duration_minutes": duration,
            "current_bpm": song.current_bpm,
            "target_bpm": song.target_bpm,
        })

        remaining -= duration
        song_index += 1

    return plan
