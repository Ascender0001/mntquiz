/**
 * Grades a free-text (typed) answer.
 *
 * For now: any non-empty answer is accepted (participation mode).
 *
 * TODO(ai): replace the body with an LLM judge that evaluates `answer` against
 * the question (and an optional stored answer key / rubric). Keep this on the
 * server so correct answers / grading logic never reach the client. The rest of
 * the app already routes text answers through this single function, so wiring in
 * AI grading is a localized change here.
 */
export function gradeTextAnswer(
  _question: { text: string },
  answer: string | undefined
): boolean {
  return typeof answer === 'string' && answer.trim().length > 0;
}
