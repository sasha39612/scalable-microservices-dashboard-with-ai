export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly details?: string
  ) {
    super(message);
  }
}
