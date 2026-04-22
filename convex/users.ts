import { mutation, query } from "./_generated/server";

// Auth removed - running in local single-user mode
export const updateCurrentUser = mutation({
  args: {},
  handler: async (_ctx) => {
    return null;
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (_ctx) => {
    return null;
  },
});
