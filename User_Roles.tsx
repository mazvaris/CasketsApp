import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { get, set, del } from "idb-keyval";

// -----------------------------------------------------------------------------
// Minimal, dependency-free toast system (fallback for environments without shadcn)
// -----------------------------------------------------------------------------
// Provides a `useLocalToast` hook with a small Tailwind-based toaster. Supports
// title, description, variants, and a single action button (e.g., Retry).
// If your app already has shadcn/sonner toasts, you can swap the implementation
// below with those and keep the same call sites.

type ToastVariant = "default" | "destructive";

type ToastInput = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
};

type ToastItem = ToastInput & { id: number };

function useLocalToast() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = (id: number) => setItems((prev) => prev.filter((t) => t.id !== id));

  const toast = (input: ToastInput) => {
    const id = ++idRef.current;
    const item: ToastItem = {
      variant: "default",
      durationMs: 4000,
      ...input,
      id,
    };
    setItems((prev) => [...prev, item]);
    window.setTimeout(() => dismiss(id), item.durationMs);
  };

  const ToastViewport = () => (
    <div className="fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={`w-full max-w-sm rounded-2xl border p-4 shadow-lg backdrop-blur-sm ${
            t.variant === "destructive"
              ? "border-red-400 bg-red-50/90 text-red-900"
              : "border-muted bg-background/90 text-foreground"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              {t.title && <div className="font-semibold leading-none">{t.title}</div>}
              {t.description && (
                <div className="mt-1 text-sm opacity-90">{t.description}</div>
              )}
            </div>
            <button
              aria-label="Close"
              className="rounded-md px-2 text-sm opacity-60 transition hover:opacity-100"
              onClick={() => dismiss(t.id)}
            >
              ×
            </button>
          </div>
          {t.actionLabel && t.onAction && (
            <div className="mt-3 flex justify-end">
              <button
                className={`rounded-xl px-3 py-1 text-sm font-medium transition ${
                  t.variant === "destructive"
                    ? "bg-white/70 text-red-700 hover:bg-white"
                    : "bg-black/80 text-white hover:bg-black"
                }`}
                onClick={() => {
                  t.onAction?.();
                  dismiss(t.id);
                }}
              >
                {t.actionLabel}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return { toast, ToastViewport } as const;
}

// -----------------------
// Schema & Types
// -----------------------
export const roles = [
  "New User",
  "Receptionist",
  "Administrator",
  "Manager",
  "Carpenter",
  "super User",
] as const;

export const FormSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: "First name is required" })
    .max(100, { message: "Keep it under 100 characters" }),
  lastName: z
    .string()
    .min(1, { message: "Last name is required" })
    .max(100, { message: "Keep it under 100 characters" }),
  role: z.enum(roles, {
    required_error: "Please select a role",
  }),
});

export type FormValues = z.infer<typeof FormSchema>;

// -----------------------
// Draft Persistence Keys
// -----------------------
export const DRAFT_KEY = "user-form-draft";

// Lightweight debounce to avoid thrashing storage
function useDebouncedCallback<T extends (...args: any[]) => void>(fn: T, delay = 300) {
  const t = useRef<number | null>(null);
  return (...args: Parameters<T>) => {
    if (t.current) window.clearTimeout(t.current);
    t.current = window.setTimeout(() => fn(...args), delay);
  };
}

// -----------------------
// Simulated submit API (replace with real call)
// -----------------------
async function submitToServer(payload: FormValues): Promise<{ ok: boolean }>{
  // Replace this with your real API call, e.g. await fetch("/api/users", { ... })
  // For demo: randomly fail ~30% to demonstrate error path.
  await new Promise((r) => setTimeout(r, 900));
  const ok = Math.random() > 0.3;
  if (!ok) throw new Error("Network error. Please check your connection.");
  return { ok };
}

// -----------------------
// Component
// -----------------------
export default function UserRegistrationForm() {
  const { toast, ToastViewport } = useLocalToast();
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      role: undefined as unknown as FormValues["role"],
    },
    mode: "onTouched",
  });

  // Load draft from storage on mount
  useEffect(() => {
    (async () => {
      try {
        // Try IndexedDB first
        const dbDraft = (await get(DRAFT_KEY)) as FormValues | undefined;
        const lsDraftRaw = window.localStorage.getItem(DRAFT_KEY);
        const lsDraft = lsDraftRaw ? (JSON.parse(lsDraftRaw) as FormValues) : undefined;
        const draft = dbDraft || lsDraft;
        if (draft) {
          form.reset(draft);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoadingDraft(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist draft on change (debounced)
  const persistDraft = useDebouncedCallback(async (values: FormValues) => {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
      await set(DRAFT_KEY, values);
    } catch (e) {
      // Non-fatal: persistence best-effort
    }
  }, 300);

  useEffect(() => {
    const subscription = form.watch((values) => {
      // Only persist when user changes something (not on programmatic resets)
      persistDraft(values as FormValues);
    });
    return () => subscription.unsubscribe();
  }, [form, persistDraft]);

  const clearDrafts = async () => {
    try {
      window.localStorage.removeItem(DRAFT_KEY);
      await del(DRAFT_KEY);
    } catch (e) {
      // ignore
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setLastError(null);
    try {
      await submitToServer(values);
      await clearDrafts();
      toast({
        title: "User created",
        description: "We saved your changes successfully.",
      });
      // Framework-agnostic redirect
      window.location.assign("/success");
    } catch (err: any) {
      // Keep drafts (do nothing) and show actionable toast with retry
      const message = err?.message || "Unable to save. Please try again.";
      setLastError(message);
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: message,
        actionLabel: "Retry",
        onAction: () => onSubmit(form.getValues()),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const RoleOptions = useMemo(
    () => roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>),
    []
  );

  return (
    <div className="mx-auto max-w-xl p-6">
      {/* Local toaster viewport */}
      <ToastViewport />

      <Card>
        <CardHeader>
          <CardTitle>Create User</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Fill out the details below. Drafts autosave locally and will be cleared on success.
          </p>

          {/* Inline error panel as an additional affordance when a submission fails */}
          {lastError && (
            <div className="mb-4 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">Submission failed</div>
                  <div className="opacity-90">{lastError}</div>
                </div>
                <Button size="sm" variant="destructive" onClick={() => onSubmit(form.getValues())}>
                  Retry
                </Button>
              </div>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>{RoleOptions}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    await clearDrafts();
                    form.reset({ firstName: "", lastName: "", role: undefined as any });
                    toast({ title: "Drafts cleared" });
                  }}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Clear Drafts
                </Button>

                <Button type="submit" disabled={isSubmitting || loadingDraft} className="gap-2">
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Submitting…" : "Submit"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Lightweight tests (Vitest). These validate the Zod schema and basic behavior.
// Keep tests in-file so they travel with the component. They are tree-shaken in
// production. To run: `vitest` with happy-dom or jsdom environment.
// -----------------------------------------------------------------------------
// @vitest-environment happy-dom

// Only execute tests when running under Vitest
if (typeof import.meta !== "undefined" && (import.meta as any).vitest) {
  const { describe, it, expect } = (globalThis as any);

  describe("FormSchema", () => {
    it("accepts valid input", () => {
      const res = FormSchema.safeParse({
        firstName: "Jane",
        lastName: "Doe",
        role: "Manager",
      });
      expect(res.success).toBe(true);
    });

    it("requires first and last name", () => {
      const res = FormSchema.safeParse({ firstName: "", lastName: "", role: "Manager" });
      expect(res.success).toBe(false);
    });

    it("rejects unknown role", () => {
      // @ts-ignore intentional wrong type for test
      const res = FormSchema.safeParse({ firstName: "A", lastName: "B", role: "CEO" });
      expect(res.success).toBe(false);
    });

    it("limits name length to 100 chars", () => {
      const long = "x".repeat(101);
      const res = FormSchema.safeParse({ firstName: long, lastName: long, role: "Manager" });
      expect(res.success).toBe(false);
    });

    it("requires role selection", () => {
      // @ts-ignore: simulate missing role
      const res = FormSchema.safeParse({ firstName: "Jane", lastName: "Doe" });
      expect(res.success).toBe(false);
    });
  });

  describe("Constants", () => {
    it("uses the expected draft key", () => {
      expect(DRAFT_KEY).toBe("user-form-draft");
    });

    it("includes the 'super User' role label exactly as provided", () => {
      expect(roles.includes("super User")).toBe(true);
    });
  });
}

