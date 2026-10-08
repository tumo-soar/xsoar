import { useTable } from "@refinedev/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import React from "react";

import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { ListView } from "@/components/refine-ui/views/list-view";
import { CreateButton } from "@/components/refine-ui/buttons/create";
import { ShowButton } from "@/components/refine-ui/buttons/show";
import { Badge } from "@/components/ui/badge";
import { type Alert, REFRESH_MS, alertNumber, isInProgress } from "./alert";
import { StatusBadge } from "./status-badge";

const columnHelper = createColumnHelper<Alert>();

export const AlertList = () => {
  const columns = React.useMemo(
    () => [
      columnHelper.accessor("number", {
        header: "Number",
        cell: ({ getValue }) => alertNumber(getValue()),
      }),
      columnHelper.accessor("received_at", {
        header: "Received",
        cell: ({ getValue }) => new Date(getValue()).toLocaleString(),
      }),
      columnHelper.accessor("source", { header: "Source" }),
      columnHelper.accessor("labels", {
        header: "Labels",
        cell: ({ getValue }) => (
          <div className="flex flex-wrap gap-1">
            {Object.entries(getValue()).map(([key, value]) => (
              <Badge key={key} variant="secondary">
                {key}={value}
              </Badge>
            ))}
          </div>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => <StatusBadge status={getValue()} />,
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => <ShowButton recordItemId={row.original.id} size="sm" />,
      }),
    ],
    [],
  );

  const table = useTable<Alert>({
    columns,
    refineCoreProps: {
      syncWithLocation: true,
      pagination: { pageSize: 20 },
      filters: {
        permanent: [{ field: "source", operator: "eq", value: "web-upload" }],
      },
      queryOptions: {
        refetchInterval: (query) =>
          query.state.data?.data.some((a) => isInProgress(a.status))
            ? REFRESH_MS
            : false,
      },
    },
  });

  return (
    <ListView>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manual log upload</h2>
        <CreateButton>Send log</CreateButton>
      </div>
      <DataTable table={table} />
    </ListView>
  );
};
