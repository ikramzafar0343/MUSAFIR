import { ERROR_CODES, type ErrorCode, type FieldError } from "@/types/api";

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly fields: readonly FieldError[];
  readonly isOperational: boolean;
  readonly retryAfterSeconds: number | undefined;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    fields: readonly FieldError[] = [],
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
    this.isOperational = true;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  static validation(fields: readonly FieldError[]): AppError {
    return new AppError("Validation failed", 400, ERROR_CODES.VALIDATION_FAILED, fields);
  }

  static unauthenticated(message = "Authentication required"): AppError {
    return new AppError(message, 401, ERROR_CODES.UNAUTHENTICATED);
  }

  static unauthorized(message = "Insufficient permissions"): AppError {
    return new AppError(message, 403, ERROR_CODES.UNAUTHORIZED);
  }

  static notFound(message = "Not found"): AppError {
    return new AppError(message, 404, ERROR_CODES.NOT_FOUND);
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409, ERROR_CODES.CONFLICT);
  }

  static unprocessable(message: string): AppError {
    return new AppError(message, 422, ERROR_CODES.UNPROCESSABLE);
  }

  static payloadTooLarge(): AppError {
    return new AppError("Payload too large", 413, ERROR_CODES.PAYLOAD_TOO_LARGE);
  }

  static rateLimited(retryAfterSeconds = 60): AppError {
    return new AppError("Too many requests", 429, ERROR_CODES.RATE_LIMITED, [], retryAfterSeconds);
  }

  static expired(message = "Request expired"): AppError {
    return new AppError(message, 401, ERROR_CODES.EXPIRED);
  }

  static replay(): AppError {
    return new AppError("Replay detected", 401, ERROR_CODES.REPLAY);
  }
}
