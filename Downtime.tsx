import * as React from "react";
import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// shadcn/ui components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle2 } from "lucide-react";

// ---------------------------------------------
// Schema & Types
// ---------------------------------------------
const departments = [
  "Cutting",
  "Assembly",
  "Sanding",
  "Spraying",
  "Upholstery/Lining",
  "Other",
] as const;

const reasons = [
  "Raw material out of stock",
  "No electricity",
  "No workforce",
  "Machine breakdown",
  "Maintenance",
  "Management directive",
  "Other",
] as const;

const FormSchema = z
  .object({
    reporter: z.string().min(2, { message: "Please enter the reporter's name." }),
    department: z.enum(departments, { required_error: "Select a department." }),
    departmentOther: z.string().optional(),
    reason: z.enum(reasons, { required_error: "Select a reason." }),
    reasonOther: z.string().optional(),
    startDate: z.string().min(1, { message: "Select a start date." }),
    startTime: z.string().min(1, { message: "Select a start time." }),
    details: z.string().optional(),
    immediateAction: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.department === "Other" && !val.departmentOther?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please specify the department.",
        path: ["departmentOther"],
      });
    }
    if (val.reason === "Other" && !val.reasonOther?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please specify the reason.",
        path: ["reasonOther"],
      });
    }

    // validate that date+time is a valid datetime
    const dtString = `${val.startDate}T${val.startTime}`;
    const dt = new Date(dtString);
    if (Number.isNaN(dt.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid date/time.",
        path: ["startTime"],
      });
    }
  });

export type DowntimeFormValues = z.infer<typeof FormSchema> & {
  // derived on submit
  startISO?: string;
};

// ---------------------------------------------
// Mock persistence (replace with your API call)
// ---------------------------------------------
async function saveDowntime(payload: any) {
  // Replace with: await fetch("/api/downtime", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
  await new Promise((r) => setTimeout(r, 800));
  try {
    const key = "downtime_records";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.push({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...payload });
    localStorage.setItem(key, JSON.stringify(existing));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ---------------------------------------------
// Component
// ---------------------------------------------
export default function DowntimeForm() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<any | null>(null);

  const form = useForm<DowntimeFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      reporter: "",
      department: undefined as unknown as (typeof departments)[number],
      departmentOther: "",
      reason: undefined as unknown as (typeof reasons)[number],
      reasonOther: "",
      startDate: "",
      startTime: "",
      details: "",
      immediateAction: "",
    },
    mode: "onBlur",
  });

  const selDepartment = form.watch("department");
  const selReason = form.watch("reason");

  function combineISO(d: string, t: string) {
    // combine local date and time into ISO string (local timezone)
    const dt = new Date(`${d}T${t}`);
    return dt.toISOString();
  }

  async function onSubmit(values: DowntimeFormValues) {
    setSubmitting(true);
    const payload = {
      reporter: values.reporter.trim(),
      department: values.department === "Other" ? values.departmentOther?.trim() : values.department,
      reason: values.reason === "Other" ? values.reasonOther?.trim() : values.reason,
      startISO: combineISO(values.startDate, values.startTime),
      details: values.details?.trim() || null,
      immediateAction: values.immediateAction?.trim() || null,
    };

    const res = await saveDowntime(payload);
    setSubmitting(false);

    if (res.ok) {
      setSubmittedData(payload);
      setOpen(true);
      form.reset();
    } else {
      // Basic surface-level error. In production, use a toast.
      alert("Failed to save: " + (res.error || "Unknown error"));
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-slate-50 py-10">
      <div className="mx-auto max-w-3xl px-4">
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl">Record Downtime</CardTitle>
            <CardDescription>
              Log details of a downtime episode for workshop analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
                {/* Reporter */}
                <FormField
                  control={form.control}
                  name="reporter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reporter</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Department */}
                <div className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((d) => (
                              <SelectItem key={d} value={d}>
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selDepartment === "Other" && (
                    <FormField
                      control={form.control}
                      name="departmentOther"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specify Department</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter department" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Reason */}
                <div className="grid gap-3">
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select reason" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {reasons.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selReason === "Other" && (
                    <FormField
                      control={form.control}
                      name="reasonOther"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specify Reason</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter reason" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Start Date & Time */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" step={60} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* More Details */}
                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>More Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what happened (optional)"
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Any context to help with root cause analysis.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Immediate Action */}
                <FormField
                  control={form.control}
                  name="immediateAction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Immediate Action Taken</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What was done immediately (optional)"
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <CardFooter className="px-0">
                  <Button type="submit" disabled={submitting} className="ml-auto">
                    {submitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Submitting
                      </span>
                    ) : (
                      "Submit"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Success Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Submission successful
            </DialogTitle>
            <DialogDescription>
              The downtime record has been saved.
            </DialogDescription>
          </DialogHeader>
          {submittedData ? (
            <div className="rounded-md bg-slate-50 p-3 text-sm">
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <span className="font-medium">Reporter:</span> {submittedData.reporter}
                </div>
                <div>
                  <span className="font-medium">Department:</span> {submittedData.department}
                </div>
                <div>
                  <span className="font-medium">Reason:</span> {submittedData.reason}
                </div>
                <div>
                  <span className="font-medium">Start:</span> {new Date(submittedData.startISO).toLocaleString()}
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" className="w-full sm:w-auto">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

