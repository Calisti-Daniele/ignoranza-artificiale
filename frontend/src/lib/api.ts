// Re-export barrel — kept for retrocompatibility.
// Server-only functions (fetchAgents, fetchShameEntries, fetchShameTranscript)
// are in api.server.ts and guarded by the `server-only` package.
// Client functions (submitToShame, upvoteShameEntry) are in api.client.ts.
export { fetchAgents, fetchShameEntries, fetchShameTranscript } from './api.server'
export { submitToShame, upvoteShameEntry } from './api.client'
