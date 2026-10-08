import { useBack, useShow } from "@refinedev/core";
import { ArrowLeftIcon } from "lucide-react";

import { ShowView } from "@/components/refine-ui/views/show-view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type Alert, REFRESH_MS, alertNumber, isInProgress } from "./alert";
import { StatusBadge } from "./status-badge";

export const AlertShow = () => {
  const back = useBack();
  const { result: alert } = useShow<Alert>({
    queryOptions: {
      refetchInterval: (query) =>
        !query.state.data || isInProgress(query.state.data.data.status)
          ? REFRESH_MS
          : false,
    },
  });

  if (!alert) return <ShowView>Loading...</ShowView>;
  const { report } = alert;

  return (
    <ShowView>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={back}>
          <ArrowLeftIcon />
        </Button>
        <h2 className="text-2xl font-bold">Alert</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{alertNumber(alert.number)}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <StatusBadge status={alert.status} />
            <span>{new Date(alert.received_at).toLocaleString()}</span>
            <span>{alert.source}</span>
            {alert.filename && <span>{alert.filename}</span>}
            {Object.entries(alert.labels).map(([key, value]) => (
              <Badge key={key} variant="secondary">
                {key}={value}
              </Badge>
            ))}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInProgress(alert.status) && (
            <p className="text-sm text-muted-foreground">
              Analysis is running. This page refreshes itself.
            </p>
          )}

          {alert.error && (
            <p className="text-sm text-destructive">
              Needs a manual check: {alert.error}
            </p>
          )}

          {report && (
            <>
              {report.summary && (
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">Summary</h3>
                  <p className="text-sm">{report.summary}</p>
                </div>
              )}

              <div className="flex gap-6 text-sm">
                <div>
                  <div className="text-muted-foreground">Verdict</div>
                  <div className="font-medium">{report.verdict}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Confidence</div>
                  <div className="font-medium">{Math.round(report.confidence * 100)}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Model</div>
                  <div className="font-medium">{report.model}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Facts</h3>
                {report.facts.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No facts backed by the log.
                  </p>
                )}
                {report.facts.map((fact, i) => (
                  <div key={i} className="space-y-2 rounded-md border p-3">
                    <p className="text-sm">{fact.text}</p>
                    <ul className="space-y-1 font-mono text-xs text-muted-foreground">
                      {fact.evidence.map((e) => (
                        <li key={e.line}>
                          <span className="mr-2 select-none">{e.line}</span>
                          {e.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {!!report.open_questions?.length && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Open questions</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {report.open_questions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </ShowView>
  );
};
