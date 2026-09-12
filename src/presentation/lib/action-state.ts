/**
 * What a Server Action hands back to the form that called it. A single message rather than a map
 * of field errors: the forms here are short, and one plain sentence at the top of the form is what
 * this audience reads — and what a screen reader announces without hunting.
 */
export type ActionState = {
  /** Already written in pt-BR by the action; null while nothing has gone wrong. */
  readonly error: string | null
  /** True once the action did what it was asked. Forms that stay on the page switch on it. */
  readonly done: boolean
  /**
   * What was typed, so a refused submit does not empty the form. React resets an uncontrolled
   * form once the action settles, and someone who has just written the story of their craft on a
   * phone will not type it again — they will leave.
   */
  readonly values?: FormValues
}

export type FormValues = Readonly<Record<string, string>>

export const IDLE_ACTION: ActionState = { error: null, done: false }

export function actionFailed(error: string, values?: FormValues): ActionState {
  return { error, done: false, values }
}

export function actionSucceeded(): ActionState {
  return { error: null, done: true }
}

/**
 * The text of a submission, to hand back with a failure. Files are left out — a browser refuses to
 * have a file field filled in by script, so the photo is chosen again either way — and so is any
 * field named in `omit`: a password is never written back into a page.
 */
export function typedValues(formData: FormData, omit: readonly string[] = []): FormValues {
  const values: Record<string, string> = {}

  for (const [name, value] of formData.entries()) {
    if (typeof value === 'string' && !omit.includes(name)) values[name] = value
  }

  return values
}
