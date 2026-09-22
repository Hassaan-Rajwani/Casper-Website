"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchCatalog } from "@/lib/firebase-hooks";

export function QueryPrefetcher() {
  const queryClient = useQueryClient();

  useEffect(() => {
    prefetchCatalog(queryClient);
  }, [queryClient]);

  return null;
}
