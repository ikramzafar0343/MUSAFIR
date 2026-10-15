export const ERROR_CODES = {
  VALIDATION_FAILED: "VALIDATION_FAILED",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  UNPROCESSABLE: "UNPROCESSABLE",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  RATE_LIMITED: "RATE_LIMITED",
  EXPIRED: "EXPIRED",
  REPLAY: "REPLAY",
  INTERNAL: "INTERNAL",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export type FieldError = {
  readonly field: string;
  readonly message: string;
};

export type ApiErrorBody = {
  readonly error: {
    readonly code: ErrorCode;
    readonly message: string;
    readonly fields?: readonly FieldError[];
  };
};

export type ApiSuccessBody<T> = {
  readonly data: T;
};

export type Pagination = {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
  readonly hasNext: boolean;
  readonly hasPrev: boolean;
  readonly nextCursor: string | null;
};
