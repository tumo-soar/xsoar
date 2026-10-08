import { createDataProvider } from "@refinedev/rest";

// api: reads alerts. Responses look like { data: [...], total: n }.
export const { dataProvider } = createDataProvider(import.meta.env.VITE_API_URL, {
  getList: {
    buildQueryParams: async ({ pagination, filters }) => {
      const { currentPage = 1, pageSize = 20 } = pagination ?? {};
      const source = filters?.find(
        (f) => "field" in f && f.field === "source" && f.operator === "eq",
      );
      return {
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        source: source && "value" in source ? source.value : undefined,
      };
    },
    mapResponse: async (response) => (await response.json<{ data: any[] }>()).data,
    getTotalCount: async (response) => (await response.json<{ total: number }>()).total,
  },
});

// collector: accepts new alerts.
export const { dataProvider: collectorProvider } = createDataProvider(
  import.meta.env.VITE_COLLECTOR_URL,
  {
    create: {
      mapResponse: async (response) => {
        const created = await response.json<{ alert_id: string }>();
        return { id: created.alert_id, ...created };
      },
    },
  },
);
