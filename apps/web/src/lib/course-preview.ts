type LessonLike = { freePreview?: boolean | null };
type ModuleLike = { lessons?: LessonLike[] | null };
type CourseLike = { modules?: ModuleLike[] | null };

/** A lesson is playable without an enrollment only when explicitly marked. */
export function isFreeLesson(lesson?: LessonLike | null): boolean {
  return lesson?.freePreview === true;
}

/** Flat (module-then-lesson) indices of every free-preview lesson, in order. */
export function freeLessonIndices(course: CourseLike): number[] {
  const indices: number[] = [];
  let flat = 0;
  for (const mod of course.modules ?? []) {
    for (const lesson of mod.lessons ?? []) {
      if (isFreeLesson(lesson)) indices.push(flat);
      flat++;
    }
  }
  return indices;
}

export function hasFreePreview(course: CourseLike): boolean {
  return freeLessonIndices(course).length > 0;
}

/** Flat index of a lesson addressed by module/lesson position, or -1. */
export function flatIndexOf(
  course: CourseLike,
  moduleIndex: number,
  lessonIndex: number
): number {
  const modules = course.modules ?? [];
  let flat = 0;
  for (let mi = 0; mi < modules.length; mi++) {
    const lessons = modules[mi].lessons ?? [];
    if (mi === moduleIndex) {
      return lessonIndex >= 0 && lessonIndex < lessons.length ? flat + lessonIndex : -1;
    }
    flat += lessons.length;
  }
  return -1;
}

/** Resolve the lesson at a flat index, matching the player's ordering. */
export function lessonAtFlatIndex<T extends LessonLike>(
  course: CourseLike,
  flatIndex: number
): T | undefined {
  let flat = 0;
  for (const mod of course.modules ?? []) {
    for (const lesson of mod.lessons ?? []) {
      if (flat === flatIndex) return lesson as T;
      flat++;
    }
  }
  return undefined;
}
