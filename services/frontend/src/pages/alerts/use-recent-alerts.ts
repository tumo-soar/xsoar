import { useList } from "@refinedev/core";

import type { Alert } from "./alert";

/** The newest 100 alerts (the api maximum), shared by the sidebar, overview and health dot. */
export const useRecentAlerts = () =>
  useList<Alert>({
    resource: "alerts",
    pagination: { currentPage: 1, pageSize: 100 },
    errorNotification: false,
    queryOptions: { refetchInterval: 15_000, retry: 1 },
  });
