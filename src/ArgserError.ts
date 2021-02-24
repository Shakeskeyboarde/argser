export type ArgserErrorReason = 'unknown' | 'incomplete';

export class ArgserError extends Error {
  constructor(public arg: string, public reason: ArgserErrorReason) {
    super(
      `Option "${arg}" ${
        reason === 'unknown' ? 'is unknown' : reason === 'incomplete' ? 'requires a value' : 'unknown error'
      }.`,
    );
  }
}
