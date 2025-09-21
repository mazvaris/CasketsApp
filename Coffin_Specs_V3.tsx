import React from "react";
import {
  useForm,
  Controller,
  useWatch,
  FieldPath,
  FieldValues,
  Control,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
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
const FLAT_SIZES = [
  "Adult",
  "Jumbo",
  '60"',
  '48"',
  '38"',
  '30"',
  '24"',
  "Stillbirth",
  "Other",
] as const;

const DOME_MATERIALS = ["Superwood", "Zimtex/Superwood"] as const;
const DOME_SIZES = ["Adult", "Other"] as const;

// Helper to allow empty-string defaults while still validating selection on submit
const enumOrEmpty = <T extends readonly [string, ...string[]]>(vals: T) =>
  z.union([z.enum(vals), z.literal("")]);

// ---------------------------------------------------------------------------
// Schema (Zod)
// ---------------------------------------------------------------------------
const schema = z.object({
  flatCaskets: z.array(
    z
      .object({
        material: enumOrEmpty(FLAT_MATERIALS),
        tier: enumOrEmpty(FLAT_TIERS),
        size: enumOrEmpty(FLAT_SIZES),
        sizeOther: z.string().optional(),
        color: enumOrEmpty(COLORS),
        colorOther: z.string().optional(),
        quantity: z.literal(1),
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
  ),

  fishCoffins: z.array(
    z
      .object({
        material: enumOrEmpty(FLAT_MATERIALS),
        tier: enumOrEmpty(FLAT_TIERS),
        size: enumOrEmpty(FLAT_SIZES),
        sizeOther: z.string().optional(),
        color: enumOrEmpty(COLORS),
        colorOther: z.string().optional(),
        quantity: z.literal(1),
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
  ),

  domeCaskets: z.array(
    z
      .object({
        material: enumOrEmpty(DOME_MATERIALS),
        size: enumOrEmpty(DOME_SIZES),
        sizeOther: z.string().optional(),
        color: enumOrEmpty(COLORS),
        colorOther: z.string().optional(),
        quantity: z.literal(1),
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
  ),
});

export type FormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Reusable Inputs
// ---------------------------------------------------------------------------
interface TextInputProps extends React.ComponentProps<typeof Input> {
  label: string;
}

function TextInput({ label, ...props }: TextInputProps) {
  return (
    <div className="w-full">
      <Label className="mb-1 block">{label}</Label>
      <Input {...props} />
    </div>
  );
}

interface SelectWithOtherProps<TValues extends FieldValues, TOption extends string> {
  control: Control<TValues>;
  name: FieldPath<TValues>;
  label: string;
  options: readonly TOption[];
  placeholder?: string;
  otherLabel?: string;
  className?: string;
  error?: string;
}

function SelectWithOther<TValues extends FieldValues, TOption extends string>({
  control,
  name,
  label,
  options,
  placeholder = "Select",
  otherLabel = "Specify other",
  className,
  error,
}: SelectWithOtherProps<TValues, TOption>) {
  const otherFieldName = `${name}Other` as FieldPath<TValues>;
  const selected = useWatch({ control, name }) as string | undefined;
  const describedBy = error ? `${String(name)}-error` : undefined;

  return (
    <div className={cn("w-full", className)}>
      <Label className="mb-1 block" htmlFor={String(name)}>
        {label}
      </Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select value={(field.value ?? "") as string} onValueChange={field.onChange}>
            <SelectTrigger id={String(name)} aria-invalid={!!error} aria-describedby={describedBy}>
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
            <Input
              className="mt-2"
              placeholder={otherLabel}
              {...field}
              aria-invalid={!!error}
              aria-describedby={describedBy}
            />
          )}
        />
      )}
      {error && (
        <p id={describedBy} className="text-sm text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
const COFFIN_TYPES = ["Fish Coffin", "Dome Casket", "Flat Casket"] as const;

type UIFormValues = FormValues & { coffinType: (typeof COFFIN_TYPES)[number] | "" };

export default function ProductionOrderForm() {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UIFormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      coffinType: "",
      flatCaskets: [{ material: "", tier: "", size: "", color: "", quantity: 1 }],
      fishCoffins: [{ material: "", tier: "", size: "", color: "", quantity: 1 }],
      domeCaskets: [{ material: "", size: "", color: "", quantity: 1 }],
    },
  });

  const selectedType = useWatch({ control, name: "coffinType" });

  const onSubmit = (values: UIFormValues) => {
    console.log("Submitted:", values);
    alert("Order captured. Check console for payload.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-6xl p-4 space-y-6">
      {/* Coffin Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Coffin Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            <Label className="mb-1 block" htmlFor="coffinType">
              Coffin Type
            </Label>
            <Controller
              control={control}
              name={"coffinType"}
              render={({ field }) => (
                <Select value={(field.value ?? "") as string} onValueChange={field.onChange}>
                  <SelectTrigger id="coffinType">
                    <SelectValue placeholder="Select Coffin Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {COFFIN_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Conditionally render the card for the selected type */}
      {selectedType === "Flat Casket" && (
        <Card>
          <CardHeader>
            <CardTitle>Flat Casket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border p-4 space-y-3">
              <div className="grid gap-4 md:grid-cols-5">
                <div className="w-full">
                  <Label className="mb-1 block">Flat Casket Material</Label>
                  <Controller
                    control={control}
                    name={"flatCaskets.0.material" as const}
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
                    name={"flatCaskets.0.tier" as const}
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
                <SelectWithOther<UIFormValues, (typeof FLAT_SIZES)[number]>
                  control={control}
                  name={"flatCaskets.0.size" as FieldPath<UIFormValues>}
                  label="Size"
                  options={FLAT_SIZES}
                  error={
                    (errors.flatCaskets?.[0]?.size?.message as string) ||
                    (errors.flatCaskets?.[0]?.sizeOther?.message as string)
                  }
                />
                <SelectWithOther<UIFormValues, (typeof COLORS)[number]>
                  control={control}
                  name={"flatCaskets.0.color" as FieldPath<UIFormValues>}
                  label="Color"
                  options={COLORS}
                  error={
                    (errors.flatCaskets?.[0]?.color?.message as string) ||
                    (errors.flatCaskets?.[0]?.colorOther?.message as string)
                  }
                />
                <div>
                  <Label className="mb-1 block">Quantity</Label>
                  <Input value={1} disabled readOnly />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedType === "Fish Coffin" && (
        <Card>
          <CardHeader>
            <CardTitle>Fish Coffin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border p-4 space-y-3">
              <div className="grid gap-4 md:grid-cols-5">
                <div className="w-full">
                  <Label className="mb-1 block">Fish Coffin Material</Label>
                  <Controller
                    control={control}
                    name={"fishCoffins.0.material" as const}
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
                    name={"fishCoffins.0.tier" as const}
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
                <SelectWithOther<UIFormValues, (typeof FLAT_SIZES)[number]>
                  control={control}
                  name={"fishCoffins.0.size" as FieldPath<UIFormValues>}
                  label="Size"
                  options={FLAT_SIZES}
                  error={
                    (errors.fishCoffins?.[0]?.size?.message as string) ||
                    (errors.fishCoffins?.[0]?.sizeOther?.message as string)
                  }
                />
                <SelectWithOther<UIFormValues, (typeof COLORS)[number]>
                  control={control}
                  name={"fishCoffins.0.color" as FieldPath<UIFormValues>}
                  label="Color"
                  options={COLORS}
                  error={
                    (errors.fishCoffins?.[0]?.color?.message as string) ||
                    (errors.fishCoffins?.[0]?.colorOther?.message as string)
                  }
                />
                <div>
                  <Label className="mb-1 block">Quantity</Label>
                  <Input value={1} disabled readOnly />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedType === "Dome Casket" && (
        <Card>
          <CardHeader>
            <CardTitle>Dome Casket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border p-4 space-y-3">
              <div className="grid gap-4 md:grid-cols-5">
                <div className="w-full">
                  <Label className="mb-1 block">Dome Casket Material</Label>
                  <Controller
                    control={control}
                    name={"domeCaskets.0.material" as const}
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

                <SelectWithOther<UIFormValues, (typeof DOME_SIZES)[number]>
                  control={control}
                  name={"domeCaskets.0.size" as FieldPath<UIFormValues>}
                  label="Size"
                  options={DOME_SIZES}
                  error={
                    (errors.domeCaskets?.[0]?.size?.message as string) ||
                    (errors.domeCaskets?.[0]?.sizeOther?.message as string)
                  }
                />

                <SelectWithOther<UIFormValues, (typeof COLORS)[number]>
                  control={control}
                  name={"domeCaskets.0.color" as FieldPath<UIFormValues>}
                  label="Color"
                  options={COLORS}
                  error={
                    (errors.domeCaskets?.[0]?.color?.message as string) ||
                    (errors.domeCaskets?.[0]?.colorOther?.message as string)
                  }
                />

                <div>
                  <Label className="mb-1 block">Quantity</Label>
                  <Input value={1} disabled readOnly />
                </div>
                <div />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
// Call `selfTest()` to verify validation scenarios without a test runner.
// ---------------------------------------------------------------------------
export function selfTest() {
  const valid: FormValues = {
    flatCaskets: [
      { material: "Superwood", tier: "Flat", size: "Adult", color: "Brown", quantity: 1 },
    ],
    fishCoffins: [
      { material: "Superwood", tier: "Flat", size: "Adult", color: "White", quantity: 1 },
    ],
    domeCaskets: [
      { material: "Superwood", size: "Adult", color: "White", quantity: 1 },
    ],
  } as any;

  const invalidOtherMissing: any = {
    flatCaskets: [
      { material: "Superwood", tier: "Flat", size: "Other", sizeOther: "", color: "White", quantity: 1 },
    ],
    fishCoffins: [
      { material: "Superwood", tier: "Flat", size: "Other", sizeOther: "", color: "White", quantity: 1 },
    ],
    domeCaskets: [
      { material: "Superwood", size: "Other", sizeOther: "", color: "White", quantity: 1 },
    ],
  };

  const invalidEmptySelects: any = {
    flatCaskets: [{ material: "", tier: "", size: "", color: "", quantity: 1 }],
    fishCoffins: [{ material: "", tier: "", size: "", color: "", quantity: 1 }],
    domeCaskets: [{ material: "", size: "", color: "", quantity: 1 }],
  };

  const invalidQuantity: any = {
    flatCaskets: [{ material: "Superwood", tier: "Flat", size: "Adult", color: "White", quantity: 2 }],
    fishCoffins: [{ material: "Superwood", tier: "Flat", size: "Adult", color: "White", quantity: 2 }],
    domeCaskets: [{ material: "Superwood", size: "Adult", color: "White", quantity: 2 }],
  };

  const invalidColorOtherMissing: any = {
    flatCaskets: [
      { material: "Superwood", tier: "Flat", size: "Adult", color: "Other", colorOther: "", quantity: 1 },
    ],
    fishCoffins: [
      { material: "Superwood", tier: "Flat", size: "Adult", color: "Other", colorOther: "", quantity: 1 },
    ],
    domeCaskets: [
      { material: "Superwood", size: "Adult", color: "Other", colorOther: "", quantity: 1 },
    ],
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

  try {
    schema.parse(invalidQuantity);
    console.error("❌ quantity literal(1) case unexpectedly passed");
  } catch {
    console.log("✅ quantity literal(1) enforced as expected");
  }

  try {
    schema.parse(invalidColorOtherMissing);
    console.error("❌ color-other-missing case unexpectedly passed");
  } catch {
    console.log("✅ color-other-missing rejected as expected");
  }
}

