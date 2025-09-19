import React from "react";
import { z } from "zod";
import {
  useForm,
  Controller,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isDate } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon } from "lucide-react";
import ReactSelect from "react-select";

/**
 * Domain enums (const assertions keep literal types)
 */
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Intern"] as const;
const WORK_LOCATIONS = [
  "Mutapa Store",
  "Mutapa Workshop",
  "Shurugwi Road Workshop",
  "Other",
] as const;
const STATUS_TYPES = ["Active", "On Leave", "Resigned", "Retired", "Other"] as const;

/**
 * Occupation options — EXACT list provided by user
 */
export const OCCUPATIONS = [
  "Receptionist",
  "Carpenter",
  "Machinist",
  "Surface Finisher",
  "Painter",
  "Upholsterer",
  "Sewing Machine Operator",
  "Liner Installer",
  "Production Supervisor",
  "Assembly Line Worker",
  "Quality Control Inspector",
  "Maintenance Technician",
  "Health & Safety Officer",
  "Warehouse Manager",
  "Packaging Specialist",
  "Delivery Driver",
  "Sales Consultant",
  "Marketing Coordinator",
  "General Manager",
  "Procurement Officer",
  "Administrative Assistant",
  "CAD Technician",
  "Graphic Designer",
  "Other",
] as const;
export type Occupation = (typeof OCCUPATIONS)[number];

// React-Select options (same list for both fields)
const OCCUPATION_OPTIONS: ReadonlyArray<{ value: Occupation; label: Occupation }> =
  OCCUPATIONS.map((o) => ({ value: o, label: o })) as const;

/**
 * Zod Schema (strict, fully typed)
 */
export const EmploymentDetailsSchema = z
  .object({
    employeeId: z
      .string({ required_error: "Employee ID is required" })
      .trim()
      .min(1, "Employee ID is required")
      .max(32, "Employee ID is too long"),

    // Primary role must be one of the provided occupations
    primaryRole: z.enum(OCCUPATIONS, {
      required_error: "Primary role is required",
    }),

    // Secondary roles: 0..n from the same set (duplicates disallowed)
    secondaryRoles: z.array(z.enum(OCCUPATIONS)).default([]),

    dateOfJoiningDate: z.date({ required_error: "Date of joining is required" }),

    employmentType: z.enum(EMPLOYMENT_TYPES, {
      required_error: "Employment Type is required",
    }),

    workLocation: z.enum(WORK_LOCATIONS, {
      required_error: "Work Location is required",
    }),

    status: z.enum(STATUS_TYPES, { required_error: "Status is required" }),
  })
  .superRefine((v, ctx) => {
    // Disallow duplicates in secondary roles
    const seen = new Set<string>();
    for (const r of v.secondaryRoles) {
      if (seen.has(r)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["secondaryRoles"],
          message: "Duplicate secondary roles are not allowed",
        });
        break;
      }
      seen.add(r);
    }
  })
  .refine(
    (v) => v.dateOfJoiningDate instanceof Date && !Number.isNaN(v.dateOfJoiningDate.getTime()),
    {
      path: ["dateOfJoiningDate"],
      message: "Invalid date",
    }
  );

export type EmploymentDetailsValues = z.infer<typeof EmploymentDetailsSchema>;

/**
 * Card-only component (keeps layout – max 2 cols)
 */
export function EmploymentDetailsCard({
  form,
  className,
}: {
  form: UseFormReturn<EmploymentDetailsValues>;
  className?: string;
}) {
  const [dateOpen, setDateOpen] = React.useState<boolean>(false);
  const currentYear = React.useMemo(() => new Date().getFullYear(), []);

  return (
    <Card className={className ? `${className} relative` : "shadow-sm relative"}>
      <CardHeader>
        <CardTitle>Employment Details</CardTitle>
      </CardHeader>

      {/* Only 1 or 2 columns */}
      <CardContent className="grid gap-6 md:grid-cols-2">
        {/* Employee ID */}
        <FormField
          control={form.control}
          name="employeeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Employee ID <span aria-hidden className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="EMP-001" required {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Occupation: Primary Role (React-Select single) */}
        <FormItem>
          <FormLabel>
            Occupation: Primary Role <span aria-hidden className="text-destructive">*</span>
          </FormLabel>
          <Controller
            name="primaryRole"
            control={form.control}
            render={({ field }) => (
              <ReactSelect
                inputId="primaryRole"
                options={OCCUPATION_OPTIONS}
                placeholder="Select primary role"
                value={OCCUPATION_OPTIONS.find((o) => o.value === field.value) ?? null}
                onChange={(opt) =>
                  field.onChange(
                    (opt as { value: Occupation } | null)?.value ?? undefined
                  )
                }
                onBlur={field.onBlur}
                isClearable
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                menuPosition="fixed"
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                classNamePrefix="rselect"
              />
            )}
          />
          <FormMessage />
        </FormItem>

        {/* Occupation: Secondary Roles (React-Select multi) */}
        <FormItem className="md:col-span-2">
          <FormLabel>Occupation: Secondary Roles</FormLabel>
          <Controller
            name="secondaryRoles"
            control={form.control}
            render={({ field }) => (
              <ReactSelect
                inputId="secondaryRoles"
                options={OCCUPATION_OPTIONS}
                isMulti
                closeMenuOnSelect={false}
                placeholder="Select secondary roles"
                value={OCCUPATION_OPTIONS.filter((o) =>
                  Array.isArray(field.value) ? field.value.includes(o.value) : false
                )}
                onChange={(opts) =>
                  field.onChange(
                    (Array.isArray(opts) ? opts : [])
                      .map((o) => (o as { value: Occupation }).value)
                  )
                }
                onBlur={field.onBlur}
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                menuPosition="fixed"
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                classNamePrefix="rselect"
              />
            )}
          />
          <FormDescription>
            Choose all secondary roles that apply (optional).
          </FormDescription>
          <FormMessage />
        </FormItem>

        {/* Date of Joining (Date) */}
        <FormField
          control={form.control}
          name="dateOfJoiningDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>
                Date of Joining (Date) <span aria-hidden className="text-destructive">*</span>
              </FormLabel>

              <FormControl>
                <Button
                  variant="outline"
                  type="button"
                  className={`justify-start font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                  aria-label="Pick date of joining"
                  onBlur={field.onBlur}
                  onClick={() => setDateOpen(true)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {isDate(field.value) ? format(field.value, "PPP") : "Pick a date"}
                </Button>
              </FormControl>

              <FormDescription>Select the employment start date.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Employment Type */}
        <FormField
          control={form.control}
          name="employmentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Employment Type <span aria-hidden className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger aria-label="Select employment type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Work Location */}
        <FormField
          control={form.control}
          name="workLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Work Location <span aria-hidden className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger aria-label="Select work location">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {WORK_LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Status <span aria-hidden className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger aria-label="Select status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {STATUS_TYPES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
      {dateOpen && (
        <div
          className="absolute inset-0 z-[1000] grid place-items-center"
          onKeyDown={(e) => {
            if (e.key === "Escape") setDateOpen(false);
          }}
          tabIndex={-1}
        >
          <div className="absolute inset-0 bg-background/60" onClick={() => setDateOpen(false)} />
          <div className="relative z-10 rounded-md border bg-popover text-popover-foreground shadow-md p-2">
            <Calendar
              mode="single"
              selected={isDate(form.getValues("dateOfJoiningDate")) ? form.getValues("dateOfJoiningDate") : undefined}
              onSelect={(d) => {
                if (d) {
                  form.setValue("dateOfJoiningDate", d, { shouldDirty: true, shouldValidate: true });
                  setDateOpen(false);
                }
              }}
              captionLayout="dropdown-buttons"
              fromYear={1990}
              toYear={currentYear + 1}
              initialFocus
            />
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * Full Form wrapper
 */
export default function EmploymentDetailsForm() {
  const form = useForm<EmploymentDetailsValues>({
    resolver: zodResolver(EmploymentDetailsSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      employeeId: "",
      primaryRole: undefined as unknown as Occupation,
      secondaryRoles: [],
      dateOfJoiningDate: undefined as unknown as Date, // set by user
      employmentType: undefined as unknown as (typeof EMPLOYMENT_TYPES)[number],
      workLocation: undefined as unknown as (typeof WORK_LOCATIONS)[number],
      status: undefined as unknown as (typeof STATUS_TYPES)[number],
    },
  });

  const onSubmit: SubmitHandler<EmploymentDetailsValues> = (values) => {
    // Combined ISO defaults to midnight local time
    const joined = new Date(values.dateOfJoiningDate);
    joined.setHours(0, 0, 0, 0);

    const payload = {
      ...values,
      dateOfJoining: joined.toISOString(),
    };

    // Replace with your mutation/transport
    // eslint-disable-next-line no-console
    console.log("Employment details submitted:", payload);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <EmploymentDetailsCard form={form} />

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Form>
  );
}

/**
 * Lightweight schema tests (call manually if you want to verify)
 */
export function testEmploymentDetailsSchema() {
  const base = {
    employeeId: "EMP-001",
    dateOfJoiningDate: new Date("2024-01-02"),
    employmentType: "Full-time" as const,
    workLocation: "Mutapa Store" as const,
    status: "Active" as const,
  } as const;

  // ✅ valid: single primary, multiple unique secondaries
  const ok = EmploymentDetailsSchema.safeParse({
    ...base,
    primaryRole: "Painter" as Occupation,
    secondaryRoles: ["Carpenter", "Receptionist"] satisfies Occupation[],
  });

  // ✅ valid: secondary may include the primary (confirm expectation)
  const okPrimaryAlsoSecondary = EmploymentDetailsSchema.safeParse({
    ...base,
    primaryRole: "Painter" as Occupation,
    secondaryRoles: ["Painter"] as Occupation[],
  });

  // ✅ valid: empty secondary roles
  const okEmptySecondary = EmploymentDetailsSchema.safeParse({
    ...base,
    primaryRole: "Carpenter" as Occupation,
    secondaryRoles: [],
  });

  // ❌ invalid: duplicate secondary role
  const dup = EmploymentDetailsSchema.safeParse({
    ...base,
    primaryRole: "Painter" as Occupation,
    secondaryRoles: ["Painter", "Painter"] as Occupation[],
  });

  // ❌ invalid: secondary contains an unknown occupation at runtime
  const badSecondary = EmploymentDetailsSchema.safeParse({
    // @ts-expect-error testing runtime validation with an invalid value
    ...base,
    primaryRole: "Painter",
    secondaryRoles: ["NotAJob"],
  });

  // ❌ invalid: primary not in list
  // @ts-expect-error - not an allowed occupation
  const badPrimary = EmploymentDetailsSchema.safeParse({
    ...base,
    primaryRole: "NotAJob",
    secondaryRoles: [],
  });

  // ❌ invalid: bad date
  const badDate = EmploymentDetailsSchema.safeParse({
    ...base,
    dateOfJoiningDate: new Date("invalid"),
    primaryRole: "Painter" as Occupation,
    secondaryRoles: [],
  });

  // eslint-disable-next-line no-console
  console.log({
    ok: ok.success,
    okPrimaryAlsoSecondary: okPrimaryAlsoSecondary.success,
    okEmptySecondary: okEmptySecondary.success,
    dup: dup.success,
    badSecondary: badSecondary.success,
    badPrimary: badPrimary.success,
    badDate: badDate.success,
    // new tests
    emptyEmployeeId: EmploymentDetailsSchema.safeParse({
      ...base,
      employeeId: "",
      primaryRole: "Painter" as Occupation,
      secondaryRoles: [],
    }).success,
    badEmploymentType: EmploymentDetailsSchema.safeParse({
      ...base,
      // @ts-expect-error runtime invalid employmentType
      employmentType: "Temp",
      primaryRole: "Carpenter" as Occupation,
      secondaryRoles: [],
    }).success,
  });
}

