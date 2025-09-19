import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * StockReceiveForm
 *
 * Fixes:
 * - Guard against undefined/null `locations` to prevent `Cannot read properties of undefined (reading 'map')`.
 * - Centralizes total cost calculation with `calcTotalCost` to avoid rounding drift.
 * - Adds opt-in inline tests (no runtime impact unless explicitly enabled).
 */

// --- Schema ---
const schema = z.object({
  quantityReceived: z
    .number({ invalid_type_error: "Enter a quantity" })
    .int("Must be a whole number")
    .positive("Must be greater than 0"),
  unitPrice: z
    .number({ invalid_type_error: "Enter a unit price" })
    .nonnegative("Cannot be negative"),
  totalCost: z
    .number({ invalid_type_error: "Total cost required" })
    .nonnegative(),
  location: z.string().min(1, "Select a location"),
});

export type StockReceiveFormValues = z.infer<typeof schema>;
export const stockReceiveSchema = schema; // exported for tests and external validation

export type LocationOption = { value: string; label: string };

interface StockReceiveFormProps {
  itemName: string;
  itemDescription?: string;
  /**
   * Optional array of location options. Safe default ([]) used if omitted.
   */
  locations?: LocationOption[];
  onSubmit?: (values: StockReceiveFormValues) => void;
}

// Utility to coerce number inputs safely
const parseNumber = (val: string) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
};

// Centralized cost calculation with 2dp rounding
export const calcTotalCost = (qty: number, unitPrice: number) => {
  const q = Number.isFinite(qty) ? qty : 0;
  const p = Number.isFinite(unitPrice) ? unitPrice : 0;
  return Number((q * p).toFixed(2));
};

export default function StockReceiveForm({
  itemName,
  itemDescription,
  locations = [], // ✅ Guard: default to empty array
  onSubmit,
}: StockReceiveFormProps) {
  const form = useForm<StockReceiveFormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      quantityReceived: 1,
      unitPrice: 0,
      totalCost: 0,
      location: "",
    },
  });

  const qty = form.watch("quantityReceived");
  const price = form.watch("unitPrice");

  // Auto-calc total cost when qty or price change
  useEffect(() => {
    form.setValue("totalCost", calcTotalCost(qty, price), { shouldValidate: true });
  }, [qty, price, form]);

  const handleSubmit = (values: StockReceiveFormValues) => {
    // Prefer the auto-calculated total on submit to avoid stale manual edits
    const clean = {
      ...values,
      totalCost: calcTotalCost(values.quantityReceived, values.unitPrice),
    };
    if (onSubmit) onSubmit(clean);
    // Fallback: log for demo
    if (!onSubmit) console.log("Stock Receive Submit", clean);
  };

  const safeLocations = Array.isArray(locations) ? locations : [];
  const noLocations = safeLocations.length === 0;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Receive Stock</CardTitle>
        <CardDescription>
          Record a received quantity for an existing item.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 rounded-2xl border p-4 bg-muted/30">
          <div className="text-sm text-muted-foreground">Item</div>
          <div className="text-base font-medium">{itemName}</div>
          {itemDescription && (
            <div className="text-sm text-muted-foreground">{itemDescription}</div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-6 grid gap-6">
            {/* Quantity Received */}
            <FormField
              control={form.control}
              name="quantityReceived"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity Received</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      placeholder="e.g. 10"
                      value={Number.isFinite(field.value as number) ? field.value : 0}
                      onChange={(e) => field.onChange(parseNumber(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the whole number of units received.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Unit Price */}
            <FormField
              control={form.control}
              name="unitPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={0.01}
                      placeholder="e.g. 12.50"
                      value={Number.isFinite(field.value as number) ? field.value : 0}
                      onChange={(e) => field.onChange(parseNumber(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Price per unit (in your base currency).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Total Cost (auto) */}
            <FormField
              control={form.control}
              name="totalCost"
              render={() => (
                <FormItem>
                  <FormLabel>Total Cost</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step={0.01}
                      readOnly
                      value={calcTotalCost(qty, price)}
                    />
                  </FormControl>
                  <FormDescription>
                    Automatically calculated as Quantity × Unit Price.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location / Storage */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location / Storage</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={noLocations}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={noLocations ? "No locations available" : "Select a location"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(safeLocations).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {noLocations
                      ? "No locations configured. Please add locations first."
                      : "Where the stock will be stored."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardFooter className="px-0">
              <div className="flex gap-3">
                <Button type="submit" disabled={noLocations}>Save Receipt</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => form.reset()}
                >
                  Reset
                </Button>
              </div>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// --- Example usage ---
// ✅ With locations
// <StockReceiveForm
//   itemName="ACME Widget"
//   itemDescription="Red anodized 20mm"
//   locations={[
//     { value: "MAIN_WH", label: "Main Warehouse" },
//     { value: "AISLE_3B", label: "Aisle 3B" },
//     { value: "BACKROOM", label: "Back Room" },
//   ]}
//   onSubmit={(data) => {
//     // Persist to your backend here
//     console.log(data);
//   }}
// />
//
// ✅ Without locations (safe: select disabled, no crash)
// <StockReceiveForm itemName="ACME Widget" />

// --- Opt-in Inline Tests ---
// To run these simple assertions in the browser console, set:
//   window.__RUN_STOCK_FORM_TESTS__ = true
//   and mount the component (or import this module).
// These do not execute unless the flag above is set.
// They are intended as smoke tests and examples; keep app tests in your test runner.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const window: any;
if (typeof window !== "undefined" && window.__RUN_STOCK_FORM_TESTS__ === true) {
  // total cost math & rounding
  console.assert(calcTotalCost(10, 5) === 50, "10×5 should be 50");
  console.assert(calcTotalCost(0, 5) === 0, "0×5 should be 0");
  console.assert(calcTotalCost(3, 2.345) === 7.04, "3×2.345 should round to 7.04");
  console.assert(calcTotalCost(NaN as unknown as number, 10) === 0, "NaN qty treated as 0");
  console.assert(calcTotalCost(2, NaN as unknown as number) === 0, "NaN price treated as 0");

  // schema happy path
  const ok = stockReceiveSchema.safeParse({
    quantityReceived: 2,
    unitPrice: 1.5,
    totalCost: 3,
    location: "MAIN_WH",
  });
  console.assert(ok.success, "schema should accept valid payload");

  // schema failures
  const bad1 = stockReceiveSchema.safeParse({
    quantityReceived: 0,
    unitPrice: 1.5,
    totalCost: 0,
    location: "MAIN_WH",
  });
  console.assert(!bad1.success, "quantity must be > 0");

  const bad2 = stockReceiveSchema.safeParse({
    quantityReceived: 5.5,
    unitPrice: 1.5,
    totalCost: 8.25,
    location: "MAIN_WH",
  });
  console.assert(!bad2.success, "quantity must be an integer");

  const bad3 = stockReceiveSchema.safeParse({
    quantityReceived: 3,
    unitPrice: -1,
    totalCost: -3,
    location: "MAIN_WH",
  });
  console.assert(!bad3.success, "unit price cannot be negative");

  const bad4 = stockReceiveSchema.safeParse({
    quantityReceived: 3,
    unitPrice: 1.2,
    totalCost: 3.6,
    location: "",
  });
  console.assert(!bad4.success, "location is required");
}

