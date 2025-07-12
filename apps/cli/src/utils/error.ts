export class CliError extends Error {
  constructor({ message, cause }: { message: string; cause?: Error }) {
    super(message, cause);
    this.name = 'CliError';
  }
}

export class UserInputError extends Error {
  hint: string;

  constructor({
    message,
    hint,
    cause,
  }: {
    message: string;
    hint: string;
    cause?: Error;
  }) {
    super(message, cause);
    this.name = 'UserInputError';
    this.hint = hint;
  }
}
