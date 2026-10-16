import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import { BrowserRouter, Route, Routes, Outlet, Navigate } from "react-router";
import routerProvider, {
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from "@refinedev/react-router";
import { AlertCreate, AlertList, AlertShow } from "./pages/alerts";
import { ApprovalList } from "./pages/approvals/list";
import { IncidentList } from "./pages/incidents/list";
import { IncidentShow } from "./pages/incidents/show";
import { IndicatorList } from "./pages/indicators/list";
import { IntegrationList } from "./pages/integrations/list";
import { Overview } from "./pages/overview";
import { PlaybookList } from "./pages/playbooks/list";
import { PlaybookShow } from "./pages/playbooks/show";
import { collectorProvider, dataProvider } from "./providers/data";
import { AppShell } from "./components/shell/app-shell";
import { ErrorComponent } from "./components/refine-ui/layout/error-component";
import { useNotificationProvider } from "./components/refine-ui/notification/use-notification-provider";
import { Toaster } from "./components/refine-ui/notification/toaster";
import { ThemeProvider } from "./components/refine-ui/theme/theme-provider";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ThemeProvider defaultTheme="dark">
            <Refine
              dataProvider={{ default: dataProvider, collector: collectorProvider }}
              notificationProvider={useNotificationProvider()}
              routerProvider={routerProvider}
              resources={[
                { name: "overview", list: "/overview", meta: { label: "Overview" } },
                {
                  name: "alerts",
                  list: "/alerts",
                  create: "/alerts/create",
                  show: "/alerts/show/:id",
                  meta: { label: "Alerts" },
                },
                {
                  name: "incidents",
                  list: "/incidents",
                  show: "/incidents/:id",
                  meta: { label: "Incidents" },
                },
                { name: "approvals", list: "/approvals", meta: { label: "Approvals" } },
                {
                  name: "playbooks",
                  list: "/playbooks",
                  show: "/playbooks/:id",
                  meta: { label: "Playbooks" },
                },
                { name: "indicators", list: "/indicators", meta: { label: "Indicators" } },
                { name: "integrations", list: "/integrations", meta: { label: "Integrations" } },
              ]}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                projectId: "It4VQP-BXYyhQ-nH17Vg",
                title: { text: "X SOAR" },
              }}
            >
              <Routes>
                <Route
                  element={
                    <AppShell>
                      <Outlet />
                    </AppShell>
                  }
                >
                  <Route index element={<Navigate to="/overview" replace />} />
                  <Route path="/overview" element={<Overview />} />
                  <Route path="/alerts">
                    <Route index element={<AlertList />} />
                    <Route path="create" element={<AlertCreate />} />
                    <Route path="show/:id" element={<AlertShow />} />
                  </Route>
                  <Route path="/incidents">
                    <Route index element={<IncidentList />} />
                    <Route path=":id" element={<IncidentShow />} />
                  </Route>
                  <Route path="/approvals" element={<ApprovalList />} />
                  <Route path="/playbooks">
                    <Route index element={<PlaybookList />} />
                    <Route path=":id" element={<PlaybookShow />} />
                  </Route>
                  <Route path="/indicators" element={<IndicatorList />} />
                  <Route path="/integrations" element={<IntegrationList />} />
                  <Route path="*" element={<ErrorComponent />} />
                </Route>
              </Routes>

              <Toaster />
              <RefineKbar />
              <UnsavedChangesNotifier />
              <DocumentTitleHandler
                handler={({ resource, action, params }) => {
                  if (resource?.name === "alerts" && action === "create") return "Upload log · X SOAR";
                  const label = resource?.meta?.label ?? "X SOAR";
                  // Only incident ids (INC-0042) read well in a tab title.
                  const id = resource?.name === "incidents" ? params?.id : undefined;
                  return id ? `${id} · ${label} · X SOAR` : `${label} · X SOAR`;
                }}
              />
            </Refine>
        </ThemeProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
