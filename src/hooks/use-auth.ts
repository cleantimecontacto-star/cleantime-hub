import { useConvexAuth } from "convex/react";

export function useAuth() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  return {
    isAuthenticated,
    isLoading,
    error: null as (Error | null),
    signinRedirect: async () => {},
    removeUser: async () => {},
  };
}
