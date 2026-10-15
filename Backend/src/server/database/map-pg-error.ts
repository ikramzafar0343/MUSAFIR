import { AppError } from "@/lib/app-error";
import { logger } from "@/lib/logger";
import { ERROR_CODES } from "@/types/api";

type PgLikeError = {
  code?: string | undefined;
  constraint?: string | undefined;
  column?: string | undefined;
  detail?: string | undefined;
  message?: string | undefined;
};

export function mapPgError(error: unknown): never {
  const pg =
    typeof error === "object" && error
      ? (error as PgLikeError)
      : ({} as PgLikeError);
  const code = String(pg.code ?? "");
  if (code === "23505") {
    throw AppError.conflict("Resource already exists");
  }
  if (code === "23503") {
    throw new AppError("Related record is invalid", 422, ERROR_CODES.UNPROCESSABLE);
  }
  if (code === "23514" || code === "23502") {
    logger.warn(
      {
        code,
        constraint: pg.constraint,
        column: pg.column,
        detail: pg.detail,
        message: pg.message,
      },
      "Postgres constraint rejected write",
    );
    const hint =
      pg.constraint === "product_categories_check"
        ? "One or more product categories are not allowed"
        : pg.constraint === "product_category_check"
          ? "Primary category is not allowed"
          : pg.constraint === "product_tile_color_check"
            ? "Card backdrop must be a #RRGGBB color"
            : pg.constraint
              ? `Constraint failed (${pg.constraint})`
              : "Constraint failed";
    throw AppError.validation([{ field: pg.column || "body", message: hint }]);
  }
  throw error;
}
