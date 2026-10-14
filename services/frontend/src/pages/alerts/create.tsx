import { useForm } from "@refinedev/react-hook-form";
import { FileTextIcon, UploadCloudIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";

import { PageHeader } from "@/components/soar/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

const MAX_BYTES = 1024 * 1024;

type FormValues = { text: string; filename?: string; labels: string };

// "env=prod, team=ops" or one pair per line
const parseLabels = (value: string) => {
  const labels: Record<string, string> = {};
  for (const pair of value.split(/[\n,]/)) {
    const [key, ...rest] = pair.split("=");
    if (key.trim()) labels[key.trim()] = rest.join("=").trim();
  }
  return labels;
};

const NEXT_STEPS = [
  ["collector", "stores the log as is and returns an alert number."],
  ["orchestrator", "creates the alert and queues AI alert validation."],
  ["worker-ai", "asks the LLM what happened and keeps only facts that cite real lines."],
  ["You", "review the verdict, the evidence and the open questions."],
];

export const AlertCreate = () => {
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const {
    refineCore: { onFinish },
    ...form
  } = useForm<FormValues, any, FormValues>({
    defaultValues: { text: "", labels: "" },
    refineCoreProps: { resource: "alerts", dataProviderName: "collector", redirect: "list" },
  });

  const text = form.watch("text");
  const filename = form.watch("filename");
  const labels = parseLabels(form.watch("labels"));
  const bytes = new Blob([text]).size;
  const lines = text ? text.split("\n").filter(Boolean).length : 0;

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      form.setError("text", { message: "File is larger than 1 MB" });
      return;
    }
    form.setValue("text", await file.text(), { shouldValidate: true });
    form.setValue("filename", file.name);
  };

  const clearFile = () => {
    form.setValue("text", "");
    form.setValue("filename", undefined);
  };

  const onSubmit = (values: FormValues) =>
    onFinish({
      text: values.text,
      filename: values.filename || undefined,
      labels: parseLabels(values.labels),
    } as never);

  return (
    <>
      <PageHeader
        back={{ to: "/alerts", label: "Alerts" }}
        title="Upload log"
        description="Send a log for analysis. It becomes an alert and goes through AI alert validation."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6 rounded-xl border bg-card p-5"
          >
            <input
              ref={fileInput}
              type="file"
              hidden
              onChange={(e) => {
                loadFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />

            {filename ? (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
                <FileTextIcon className="size-5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{filename}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatBytes(bytes)} · {lines} lines
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon" className="size-8" onClick={clearFile}>
                  <XIcon />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  loadFile(e.dataTransfer.files[0]);
                }}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center",
                  "transition-[border-color,background-color] duration-150 ease-out",
                  dragging ? "border-primary bg-primary/5" : "hover:border-foreground/25 hover:bg-muted/30",
                )}
              >
                <UploadCloudIcon
                  className={cn("size-6 text-muted-foreground", dragging && "text-primary")}
                />
                <span className="text-sm font-medium">Drop a log file or click to choose</span>
                <span className="text-xs text-muted-foreground">Plain text, up to 1 MB</span>
              </button>
            )}

            <FormField
              control={form.control}
              name="text"
              rules={{
                required: "Log text is required",
                validate: (v) => new Blob([v]).size <= MAX_BYTES || "Text is larger than 1 MB",
              }}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Log</FormLabel>
                    <span
                      className={cn(
                        "text-xs tabular-nums text-muted-foreground",
                        bytes > MAX_BYTES && "text-destructive",
                      )}
                    >
                      {formatBytes(bytes)} of 1 MB
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={14}
                      spellCheck={false}
                      placeholder="Or paste log lines here"
                      className="max-h-[32rem] min-h-64 font-mono text-xs leading-relaxed"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="labels"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Labels</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="env=prod, team=ops" />
                  </FormControl>
                  <FormDescription>key=value pairs separated by commas</FormDescription>
                  {Object.keys(labels).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(labels).map(([key, value]) => (
                        <span
                          key={key}
                          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                        >
                          {key}={value}
                        </span>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 border-t pt-5">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Sending…" : "Send for analysis"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>

        <aside className="rounded-xl border bg-card p-5">
          <h2 className="text-sm font-medium">What happens next</h2>
          <ol className="mt-4 space-y-4">
            {NEXT_STEPS.map(([who, what], i) => (
              <li key={who} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2 text-sm">
                <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-medium tabular-nums">
                  {i + 1}
                </span>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">{who}</span> {what}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-5 border-t pt-4 text-xs text-muted-foreground">
            Example logs are in <code className="font-mono">samples/</code> at the repository root.
            Without an OpenRouter key the alert ends in “Needs manual check”.
          </p>
        </aside>
      </div>
    </>
  );
};
