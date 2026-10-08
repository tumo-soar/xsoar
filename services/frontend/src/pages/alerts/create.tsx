import { useForm } from "@refinedev/react-hook-form";
import { UploadIcon } from "lucide-react";
import { useRef } from "react";
import { useNavigate } from "react-router";

import { CreateView, CreateViewHeader } from "@/components/refine-ui/views/create-view";
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

export const AlertCreate = () => {
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const {
    refineCore: { onFinish },
    ...form
  } = useForm<FormValues, any, FormValues>({
    defaultValues: { text: "", labels: "" },
    refineCoreProps: { resource: "alerts", dataProviderName: "collector", redirect: "list" },
  });

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      form.setError("text", { message: "File is larger than 1 MB" });
      return;
    }
    form.setValue("text", await file.text(), { shouldValidate: true });
    form.setValue("filename", file.name);
  };

  const onSubmit = (values: FormValues) =>
    onFinish({
      text: values.text,
      filename: values.filename || undefined,
      labels: parseLabels(values.labels),
    } as never);

  return (
    <CreateView>
      <CreateViewHeader title="Send log" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center gap-3">
            <input
              ref={fileInput}
              type="file"
              hidden
              onChange={(e) => {
                loadFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button type="button" variant="outline" onClick={() => fileInput.current?.click()}>
              <UploadIcon /> Load from file
            </Button>
            <span className="text-sm text-muted-foreground">{form.watch("filename")}</span>
          </div>

          <FormField
            control={form.control}
            name="text"
            rules={{
              required: "Log text is required",
              validate: (v) =>
                new Blob([v]).size <= MAX_BYTES || "Text is larger than 1 MB",
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Log</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={14} className="font-mono text-xs" />
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
                <FormDescription>key=value, separated by commas</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Sending..." : "Send"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </CreateView>
  );
};
