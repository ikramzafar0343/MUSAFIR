import type { Pagination } from "@/types/api";

export function paginate(page: number, limit: number, total: number, nextCursor: string | null): Pagination {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 0,
    hasNext: page * limit < total || Boolean(nextCursor),
    hasPrev: page > 1,
    nextCursor,
  };
}

export function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`, "utf8").toString("base64url");
}

export function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  try {
    const [iso, id] = Buffer.from(cursor, "base64url").toString("utf8").split("|");
    if (!iso || !id) {
      return null;
    }
    const createdAt = new Date(iso);
    if (Number.isNaN(createdAt.getTime())) {
      return null;
    }
    return { createdAt, id };
  } catch {
    return null;
  }
}
