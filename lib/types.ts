// Single source of truth for the HTTP contract, imported by BOTH the API routes
// (server) and the create form (client) so the two can't drift apart.

export type CreatePasteRequest = {
  content: string;
  ttl_seconds?: number | null;
  max_views?: number | null;
};

export type CreatePasteResponse = {
  id: string;
  url: string;
};

export type PasteView = {
  content: string;
  remaining_views: number | null;
  expires_at: string | null;
};

export type ErrorResponse = {
  error: string;
};
