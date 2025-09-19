import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

/**
 * Strict Zod schema (no `any`) for the Previous Experience section + Additional Information
 */
export const PreviousExperienceSchema = z
  .object({
    skills: z
      .string({ required_error: "Please describe relevant skills." })
      .trim()
      .min(1, "Please describe relevant skills."),
    certifications: z
      .string({ required_error: "Please list certifications or training." })
      .trim()
      .min(1, "Please list certifications or training."),
    // Optional notes field; strictly typed and length-bounded
    additionalInfo: z
      .string()
      .trim()
      .max(2000, "Please keep additional info under 2000 characters.")
      .optional(),
  })
  .strict();

export type PreviousExperienceValues = z.infer<typeof PreviousExperienceSchema>;

/**
 * Field configuration used to render form items in a loop
 * Ensures type-safety via `keyof PreviousExperienceValues`
 */
type FieldKey = keyof PreviousExperienceValues;

interface FieldConfig {
  name: Exclude<FieldKey, "additionalInfo">; // config for the first card only
  label: string;
  placeholder: string;
  description?: string;
  rows?: number;
}

const FIELD_CONFIG: ReadonlyArray<FieldConfig> = [
  {
    name: "skills",
    label: "Skills & Competencies",
    placeholder: "e.g. Diesel engines, hydraulics, preventative maintenance...",
    description: "Comma-separated or free-form notes.",
    rows: 6,
  },
  {
    name: "certifications",
    label: "Certifications & Training",
    placeholder: "e.g. OSHA, Defensive Driving, OEM certificates...",
    rows: 6,
    description: "List training, licenses, and certificates.",
  },
] as const;

export interface PreviousExperienceFormProps {
  /** Optional initial values; if omitted, defaults to empty strings */
  initialValues?: PreviousExperienceValues;
  /** Submit handler for the parent; receives validated values */
  onSubmit?: (values: PreviousExperienceValues) => void;
  /** Tailwind className passthrough for the root Card */
  className?: string;
}

/**
 * A fully-typed, self-contained form that preserves the original layout
 * (Cards with a two-column grid on md+ screens) and renders fields from a
 * type-safe configuration map.
 */
export default function PreviousExperienceForm({
  initialValues,
  onSubmit,
  className,
}: PreviousExperienceFormProps) {
  const form = useForm<PreviousExperienceValues>({
    resolver: zodResolver(PreviousExperienceSchema),
    defaultValues: initialValues ?? {
      skills: "",
      certifications: "",
      additionalInfo: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const handleSubmit = (values: PreviousExperienceValues) => {
    // Pass values upward if handler provided; otherwise no-op
    onSubmit?.(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Work history card */}
        <Card className={className ?? "shadow-sm"}>
          <CardHeader>
            <CardTitle>Previous Experience / Work History</CardTitle>
            <p className="text-sm text-muted-foreground">
              Tell us about your background, skills, and relevant certifications.
            </p>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            {FIELD_CONFIG.map((cfg) => (
              <FormField
                key={cfg.name}
                control={form.control}
                name={cfg.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{cfg.label}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={cfg.rows ?? 6}
                        placeholder={cfg.placeholder}
                        {...field}
                      />
                    </FormControl>
                    {cfg.description ? (
                      <FormDescription>{cfg.description}</FormDescription>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </CardContent>
        </Card>

        {/* Additional Information card (below) */}
        <Card className={className ?? "shadow-sm"}>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <p className="text-sm text-muted-foreground">
              Optional notes about availability, constraints, equipment familiarity, or anything else relevant.
            </p>
          </CardHeader>
          <CardContent className="grid gap-6">
            <FormField
              control={form.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Information</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={6}
                      placeholder="e.g. Available for night shifts, experience with CAT ET diagnostics, needs PPE provided, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Optional. Max 2000 characters.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit button at the bottom of the form */}
        <div className="flex justify-end">
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Form>
  );
}

