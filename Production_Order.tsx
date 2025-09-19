import React from "react";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ASSIGNED_TO = ["Workshop Team", "Support Team", "Other"] as const;
const REQUESTED_BY = ["Director", "Manager", "Other"] as const;

const SIZES_COMMON = [
  "Adult",
  '60"',
  '48"',
  '38"',
  '30"',
  '24"',
  "Stillbirth",
  "Other",
] as const;

const COLORS = ["White", "Brown", "Other"] as const;

const FLAT_MATERIALS = ["Superwood", "Zimtex/Superwood"] as const;
const FLAT_TIERS = ["Flat", "1 Tier", "2 Tier", "3 Tier"] as const;
const FLAT_SIZES = ["Adult", "Jumbo", '60"', '48"', '38"', '30"', '24"', "Stillbirth", "Other"] as const;

const DOME_MATERIALS = ["Superwood", "Zimtex/Superwood"] as const;
const DOME_SIZES = ["Adult", "Other"] as const;

const DURATION_UNITS = ["Hours", "Days", "Weeks", "Months"] as const;

// Helper to allow empty-string defaults while still validating selection on submit
const enumOrEmpty = <T extends readonly [string, ...string[]]>(vals: T) =>
  z.union([z.enum(vals), z.literal("")]);

// ---------------------------------------------------------------------------
// Schema (Zod)
// ---------------------------------------------------------------------------
const baseQuantity = z
  .number({ invalid_type_error: "Quantity must be a number" })
  .int("Quantity must be an integer")
  .min(1, "Min quantity is 1");

const schema = z.object({
  job: z
    .object({
      expectedStartDate: z.string().min(1, "Date is required"),
      expectedStartTime: z.string().min(1, "Time is required"),
      expectedDurationValue: z
        .number({ invalid_type_error: "Duration must be a number" })
        .min(1, "Duration is required"),
      expectedDurationUnit: enumOrEmpty(DURATION_UNITS),
      assignedTo: enumOrEmpty(ASSIGNED_TO),
      assignedToOther: z.string().optional(),
      requestedBy: enumOrEmpty(REQUESTED_BY),
      requestedByOther: z.string().optional(),
    })
    // Require a real selection (not empty)
    .refine((v) => v.expectedDurationUnit !== "", {
      path: ["expectedDurationUnit"],
      message: "Please select a duration unit.",
    })
    .refine((v) => v.assignedTo !== "", {
      path: ["assignedTo"],
      message: "Please select the assignee team.",
    })
    .refine((v) => v.requestedBy !== "", {
      path: ["requestedBy"],
      message: "Please select who requested.",
    })
    // If "Other" is chosen, require the companion text field
    .refine((v) => v.assignedTo !== "Other" || !!v.assignedToOther?.trim(), {
      path: ["assignedToOther"],
      message: "Please specify who it's assigned to.",
    })
    .refine((v) => v.requestedBy !== "Other" || !!v.requestedByOther?.trim(), {
      path: ["requestedByOther"],
      message: "Please specify who requested.",
    }),

  coffinFishes: z
    .array(
      z
        .object({
          fishType: z.string().min(1, "Fish type is required"),
          size: enumOrEmpty(SIZES_COMMON),
          sizeOther: z.string().optional(),
          color: enumOrEmpty(COLORS),
          colorOther: z.string().optional(),
          quantity: baseQuantity,
        })
        .refine((v) => v.size !== "", { path: ["size"], message: "Please select a size." })
        .refine((v) => v.color !== "", { path: ["color"], message: "Please select a color." })
        .refine((v) => v.size !== "Other" || !!v.sizeOther?.trim(), {
          path: ["sizeOther"],
          message: "Please specify the size.",
        })
        .refine((v) => v.color !== "Other" || !!v.colorOther?.trim(), {
          path: ["colorOther"],
          message: "Please specify the color.",
        })
    )
    .min(1, "Add at least one Coffin (Fish) item"),

  flatCaskets: z
    .array(
      z
        .object({
          material: enumOrEmpty(FLAT_MATERIALS),
          tier: enumOrEmpty(FLAT_TIERS),
          size: enumOrEmpty(FLAT_SIZES),
          sizeOther: z.string().optional(),
          color: enumOrEmpty(COLORS),
          colorOther: z.string().optional(),
          quantity: baseQuantity,
        })
        .refine((v) => v.material !== "", { path: ["material"], message: "Please select material." })
        .refine((v) => v.tier !== "", { path: ["tier"], message: "Please select tier." })
        .refine((v) => v.size !== "", { path: ["size"], message: "Please select size." })
        .refine((v) => v.color !== "", { path: ["color"], message: "Please select color." })
        .refine((v) => v.size !== "Other" || !!v.sizeOther?.trim(), {
          path: ["sizeOther"],
          message: "Please specify the size.",
        })
        .refine((v) => v.color !== "Other" || !!v.colorOther?.trim(), {
          path: ["colorOther"],
          message: "Please specify the color.",
        })
    )
    .min(1, "Add at least one Flat Casket"),

  domeCaskets: z
    .array(
      z
        .object({
          material: enumOrEmpty(DOME_MATERIALS),
          size: enumOrEmpty(DOME_SIZES),
          sizeOther: z.string().optional(),
          color: enumOrEmpty(COLORS),
          colorOther: z.string().optional(),
          quantity: baseQuantity,
        })
        .refine((v) => v.material !== "", { path: ["material"], message: "Please select material." })
        .refine((v) => v.size !== "", { path: ["size"], message: "Please select size." })
        .refine((v) => v.color !== "", { path: ["color"], message: "Please select color." })
        .refine((v) => v.size !== "Other" || !!v.sizeOther?.trim(), {
          path: ["sizeOther"],
          message: "Please specify the size.",
        })
        .refine((v) => v.color !== "Other" || !!v.colorOther?.trim(), {
          path: ["colorOther"],
          message: "Please specify the color.",
        })
    )
    .min(1, "Add at least one Dome Casket"),
});

export type FormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Reusable Inputs
// ---------------------------------------------------------------------------
interface SelectWithOtherProps<T extends string> {
  control: any;
  name: string;
  label: string;
  options: readonly T[];
  placeholder?: string;
  otherLabel?: string;
  className?: string;
}

function SelectWithOther<T extends string>({
  control,
  name,
  label,
  options,
  placeholder = "Select",
  otherLabel = "Specify other",
  className,
}: SelectWithOtherProps<T>) {
  const otherFieldName = `${name}Other` as const;
  const selected = useWatch({ control, name }) as string | undefined;

  return (
    <div className={cn("w-full", className)}>
      <Label className="mb-1 block">{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select value={(field.value ?? "") as string} onValueChange={field.onChange}>
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {selected === "Other" && (
        <Controller
          control={control}
          name={otherFieldName}
          render={({ field }) => (
            <Input className="mt-2" placeholder={otherLabel} {...field} />
          )}
        />
      )}
    </div>
  );
}

function NumberInput({ label, ...props }: React.ComponentProps<typeof Input> & { label: string }) {
  return (
    <div className="w-full">
      <Label className="mb-1 block">{label}</Label>
      <Input type="number" min={1} step={1} {...props} />
    </div>
  );
}

function TextInput({ label, ...props }: React.ComponentProps<typeof Input> & { label: string }) {
  return (
    <div className="w-full">
      <Label className="mb-1 block">{label}</Label>
      <Input {...props} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function ProductionOrderForm() {
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      job: {
        expectedStartDate: "",
        expectedStartTime: "",
        expectedDurationValue: undefined as unknown as number, // user must fill
        expectedDurationUnit: "", // default to placeholder
        assignedTo: "",
        requestedBy: "",
      },
      coffinFishes: [{ fishType: "", size: "", color: "", quantity: 1 }],
      flatCaskets: [{ material: "", tier: "", size: "", color: "", quantity: 1 }],
      domeCaskets: [{ material: "", size: "", color: "", quantity: 1 }],
    },
  });

  // Field Arrays
  const coffinArray = useFieldArray({ control, name: "coffinFishes" });
  const flatArray = useFieldArray({ control, name: "flatCaskets" });
  const domeArray = useFieldArray({ control, name: "domeCaskets" });

  const onSubmit = (values: FormValues) => {
    console.log("Submitted:", values);
    alert("Order captured. Check console for payload.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-6xl p-4 space-y-6">
      {/* Job Order Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Job Order Specifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label className="mb-1 block">Expected start date</Label>
              <Input type="date" {...register("job.expectedStartDate")} />
              {errors.job?.expectedStartDate && (
                <p className="text-sm text-red-600 mt-1">{errors.job.expectedStartDate.message}</p>
              )}
            </div>
            <div>
              <Label className="mb-1 block">Expected start time</Label>
              <Input type="time" {...register("job.expectedStartTime")} />
              {errors.job?.expectedStartTime && (
                <p className="text-sm text-red-600 mt-1">{errors.job.expectedStartTime.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="mb-1 block">Duration</Label>
                <Input
                  type="number"
                  min={1}
                  {...register("job.expectedDurationValue", { valueAsNumber: true })}
                />
                {errors.job?.expectedDurationValue && (
                  <p className="text-sm text-red-600 mt-1">{errors.job.expectedDurationValue.message}</p>
                )}
              </div>
              <div>
                <Label className="mb-1 block">Unit</Label>
                <Controller
                  control={control}
                  name="job.expectedDurationUnit"
                  render={({ field }) => (
                    <Select value={(field.value ?? "") as string} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_UNITS.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.job?.expectedDurationUnit && (
                  <p className="text-sm text-red-600 mt-1">{errors.job.expectedDurationUnit.message}</p>
                )}
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectWithOther
              control={control}
              name="job.assignedTo"
              label="Assigned to"
              options={ASSIGNED_TO}
              placeholder="Select team"
              otherLabel="Specify assignee"
            />
            {watch("job.assignedTo") === "Other" && (
              <div>
                <Label className="mb-1 block">Specify assignee</Label>
                <Input {...register("job.assignedToOther")} />
                {errors.job?.assignedToOther && (
                  <p className="text-sm text-red-600 mt-1">{errors.job.assignedToOther.message}</p>
                )}
              </div>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectWithOther
              control={control}
              name="job.requestedBy"
              label="Requested by"
              options={REQUESTED_BY}
              placeholder="Select role"
              otherLabel="Specify requester"
            />
            {watch("job.requestedBy") === "Other" && (
              <div>
                <Label className="mb-1 block">Specify requester</Label>
                <Input {...register("job.requestedByOther")} />
                {errors.job?.requestedByOther && (
                  <p className="text-sm text-red-600 mt-1">{errors.job.requestedByOther.message}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Coffin (Fish) Specifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Coffin Fish Type</CardTitle>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              coffinArray.append({ fishType: "", size: "", color: "", quantity: 1 })
            }
          >
            <Plus className="h-4 w-4 mr-2" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {coffinArray.fields.map((field, idx) => (
            <div key={field.id} className="rounded-2xl border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Item #{idx + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => coffinArray.remove(idx)}
                  aria-label={`Remove coffin fish item ${idx + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <TextInput
                  label="Coffin Fish Type"
                  {...register(`coffinFishes.${idx}.fishType` as const)}
                />
                <SelectWithOther
                  control={control}
                  name={`coffinFishes.${idx}.size`}
                  label="Size"
                  options={SIZES_COMMON}
                />
                <SelectWithOther
                  control={control}
                  name={`coffinFishes.${idx}.color`}
                  label="Color"
                  options={COLORS}
                />
                <NumberInput
                  label="Quantity"
                  {...(register(`coffinFishes.${idx}.quantity` as const, { valueAsNumber: true }) as any)}
                />
              </div>
              <div className="grid gap-2 md:grid-cols-4">
                <div />
                {errors.coffinFishes?.[idx]?.size && (
                  <p className="text-sm text-red-600">{errors.coffinFishes?.[idx]?.size?.message as string}</p>
                )}
                {errors.coffinFishes?.[idx]?.color && (
                  <p className="text-sm text-red-600">{errors.coffinFishes?.[idx]?.color?.message as string}</p>
                )}
                {errors.coffinFishes?.[idx]?.quantity && (
                  <p className="text-sm text-red-600">{errors.coffinFishes?.[idx]?.quantity?.message as string}</p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Flat Casket Specifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Flat Casket Specifications</CardTitle>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              flatArray.append({ material: "", tier: "", size: "", color: "", quantity: 1 })
            }
          >
            <Plus className="h-4 w-4 mr-2" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {flatArray.fields.map((field, idx) => (
            <div key={field.id} className="rounded-2xl border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Flat Casket #{idx + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => flatArray.remove(idx)}
                  aria-label={`Remove flat casket ${idx + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-5">
                <div className="w-full">
                  <Label className="mb-1 block">Flat Casket Material</Label>
                  <Controller
                    control={control}
                    name={`flatCaskets.${idx}.material` as const}
                    render={({ field }) => (
                      <Select value={(field.value ?? "") as string} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                        <SelectContent>
                          {FLAT_MATERIALS.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="w-full">
                  <Label className="mb-1 block">Tier</Label>
                  <Controller
                    control={control}
                    name={`flatCaskets.${idx}.tier` as const}
                    render={({ field }) => (
                      <Select value={(field.value ?? "") as string} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                        <SelectContent>
                          {FLAT_TIERS.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <SelectWithOther
                  control={control}
                  name={`flatCaskets.${idx}.size`}
                  label="Size"
                  options={FLAT_SIZES}
                />
                <SelectWithOther
                  control={control}
                  name={`flatCaskets.${idx}.color`}
                  label="Color"
                  options={COLORS}
                />
                <NumberInput
                  label="Quantity"
                  {...(register(`flatCaskets.${idx}.quantity` as const, { valueAsNumber: true }) as any)}
                />
              </div>
              <div className="grid gap-2 md:grid-cols-5">
                <div />
                <div />
                {errors.flatCaskets?.[idx]?.size && (
                  <p className="text-sm text-red-600">{errors.flatCaskets?.[idx]?.size?.message as string}</p>
                )}
                {errors.flatCaskets?.[idx]?.color && (
                  <p className="text-sm text-red-600">{errors.flatCaskets?.[idx]?.color?.message as string}</p>
                )}
                {errors.flatCaskets?.[idx]?.quantity && (
                  <p className="text-sm text-red-600">{errors.flatCaskets?.[idx]?.quantity?.message as string}</p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dome Casket Specifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dome Casket Specifications</CardTitle>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              domeArray.append({ material: "", size: "", color: "", quantity: 1 })
            }
          >
            <Plus className="h-4 w-4 mr-2" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {domeArray.fields.map((field, idx) => (
            <div key={field.id} className="rounded-2xl border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Dome Casket #{idx + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => domeArray.remove(idx)}
                  aria-label={`Remove dome casket ${idx + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-5">
                <div className="w-full">
                  <Label className="mb-1 block">Dome Casket Material</Label>
                  <Controller
                    control={control}
                    name={`domeCaskets.${idx}.material` as const}
                    render={({ field }) => (
                      <Select value={(field.value ?? "") as string} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOME_MATERIALS.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <SelectWithOther
                  control={control}
                  name={`domeCaskets.${idx}.size`}
                  label="Size"
                  options={DOME_SIZES}
                />
                <SelectWithOther
                  control={control}
                  name={`domeCaskets.${idx}.color`}
                  label="Color"
                  options={COLORS}
                />
                <NumberInput
                  label="Quantity"
                  {...(register(`domeCaskets.${idx}.quantity` as const, { valueAsNumber: true }) as any)}
                />
                <div />
              </div>
              <div className="grid gap-2 md:grid-cols-5">
                <div />
                {errors.domeCaskets?.[idx]?.size && (
                  <p className="text-sm text-red-600">{errors.domeCaskets?.[idx]?.size?.message as string}</p>
                )}
                {errors.domeCaskets?.[idx]?.color && (
                  <p className="text-sm text-red-600">{errors.domeCaskets?.[idx]?.color?.message as string}</p>
                )}
                {errors.domeCaskets?.[idx]?.quantity && (
                  <p className="text-sm text-red-600">{errors.domeCaskets?.[idx]?.quantity?.message as string}</p>
                )}
                <div />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          Save Order
        </Button>
        <Button type="button" variant="outline" onClick={() => reset()}>
          Reset
        </Button>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="text-sm text-red-600">Please fix the highlighted errors before saving.</div>
      )}
    </form>
  );
}

// ---------------------------------------------------------------------------
// Lightweight self-tests (run manually in dev console):
// Call `selfTest()` to verify common validation scenarios without a test runner.
// ---------------------------------------------------------------------------
export function selfTest() {
  const valid: FormValues = {
    job: {
      expectedStartDate: "2025-09-16",
      expectedStartTime: "09:00",
      expectedDurationValue: 3,
      expectedDurationUnit: "Hours",
      assignedTo: "Workshop Team",
      requestedBy: "Manager",
    },
    coffinFishes: [{ fishType: "Type A", size: "Adult", color: "White", quantity: 1 }],
    flatCaskets: [
      { material: "Superwood", tier: "Flat", size: "Adult", color: "Brown", quantity: 2 },
    ],
    domeCaskets: [{ material: "Superwood", size: "Adult", color: "White", quantity: 1 }],
  } as any;

  const invalidOtherMissing: any = {
    job: {
      expectedStartDate: "2025-09-16",
      expectedStartTime: "10:00",
      expectedDurationValue: 2,
      expectedDurationUnit: "Days",
      assignedTo: "Other",
      assignedToOther: "",
      requestedBy: "Manager",
    },
    coffinFishes: [{ fishType: "Type B", size: "Other", sizeOther: "", color: "White", quantity: 1 }],
    flatCaskets: [{ material: "Superwood", tier: "Flat", size: "Adult", color: "White", quantity: 1 }],
    domeCaskets: [{ material: "Superwood", size: "Adult", color: "White", quantity: 1 }],
  };

  const invalidEmptySelects: any = {
    job: {
      expectedStartDate: "2025-09-16",
      expectedStartTime: "10:00",
      expectedDurationValue: 2,
      expectedDurationUnit: "",
      assignedTo: "",
      requestedBy: "",
    },
    coffinFishes: [{ fishType: "Type C", size: "", color: "", quantity: 1 }],
    flatCaskets: [{ material: "", tier: "", size: "", color: "", quantity: 1 }],
    domeCaskets: [{ material: "", size: "", color: "", quantity: 1 }],
  };

  try {
    schema.parse(valid);
    console.log("✅ valid case passed");
  } catch (e) {
    console.error("❌ valid case failed", e);
  }

  try {
    schema.parse(invalidOtherMissing);
    console.error("❌ other-missing case unexpectedly passed");
  } catch {
    console.log("✅ other-missing case rejected as expected");
  }

  try {
    schema.parse(invalidEmptySelects);
    console.error("❌ empty-selects case unexpectedly passed");
  } catch {
    console.log("✅ empty-selects case rejected as expected");
  }
}

