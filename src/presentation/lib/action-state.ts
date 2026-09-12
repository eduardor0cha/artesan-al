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
}

export const IDLE_ACTION: ActionState = { error: null, done: false }

export function actionFailed(error: string): ActionState {
  return { error, done: false }
}

export function actionSucceeded(): ActionState {
  return { error: null, done: true }
}
