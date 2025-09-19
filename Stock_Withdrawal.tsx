import * as React from "react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// shadcn/ui components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ------- Types -------
export type StockItem = {
  id: string;
  name: string;
  sku?: string;
  uom?: string; // unit of measure, e.g., kg, pcs
  availableQty?: number; // optional hint of availability
};

const FormSchema = z.object({
  stockItemId: z.string().min(1, "Please select a stock item."),
  quantity: z
    .coerce
    .number({ invalid_type_error: "Enter a valid quantity." })
    .int("Quantity must be a whole number.")
    .positive("Quantity must be greater than 0."),
  requestedBy: z.string().min(1, "Who requested this withdrawal?"),
  jobNumber: z.string().min(1, "Job number is required."),
});

export type StockWithdrawalFormValues = z.infer<typeof FormSchema>;

export type StockWithdrawalFormProps = {
  /**
   * Pre-populated list of stock items for the dropdown.
   * May be undefined during initial data load.
   */
  items?: StockItem[];
  /**
   * Called with validated form values. Return a promise to let the button show a loading state if desired.
   */
  onSubmit?: (values: StockWithdrawalFormValues) => void | Promise<void>;
  /** Provide defaults, e.g. when editing */
  defaultValues?: Partial<StockWithdrawalFormValues>;
  /** Disable all fields & button (e.g. when saving) */
  disabled?: boolean;
  /** Optional title override */
  title?: string;
  /** Optional description override */
  description?: string;
};

export default function StockWithdrawalForm({
  items = [], // ✅ Robust default prevents undefined errors
  onSubmit,
  defaultValues,
  disabled,
  title = "Withdraw Stock for Production",
  description = "Record a stock item removed from inventory for a job.",
}: StockWithdrawalFormProps) {
  const form = useForm<StockWithdrawalFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      stockItemId: "",
      quantity: 1,
      requestedBy: "",
      jobNumber: "",
      ...defaultValues,
    },
    mode: "onChange",
  });

  const selectedId = form.watch("stockItemId");
  // ✅ Guard against undefined by relying on the default []
  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedId),
    [items, selectedId]
  );

  const noItems = items.length === 0;

  async function handleSubmit(values: StockWithdrawalFormValues) {
    if (onSubmit) {
      await onSubmit(values);
    } else {
      // Fallback for quick demos
      console.log("Stock withdrawal submitted:", values);
      alert("Submitted! Check console for payload.");
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid gap-6"
          >
            {/* Stock Item */}
            <FormField
              control={form.control}
              name="stockItemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Item</FormLabel>
                  <Select
                    disabled={disabled || noItems}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder={noItems ? "No stock items available" : "Select a stock item"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem value={item.id} key={item.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-xs opacity-70">
                              {item.sku ? `SKU: ${item.sku}` : ""}
                              {item.sku && item.uom ? " • " : ""}
                              {item.uom ?? ""}
                              {typeof item.availableQty === "number"
                                ? ` • Avail: ${item.availableQty}`
                                : ""}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {noItems ? (
                      <span className="text-red-600">No stock items found. Please add items to your catalog and reload.</span>
                    ) : selectedItem ? (
                      <span>
                        Selected: <span className="font-medium">{selectedItem.name}</span>
                        {typeof selectedItem.availableQty === "number" && (
                          <>
                            {" "}• Available: {selectedItem.availableQty}
                            {selectedItem.uom ? ` ${selectedItem.uom}` : ""}
                          </>
                        )}
                      </span>
                    ) : (
                      "Prepopulated dropdown of existing stock items"
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity removed</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      placeholder="e.g. 5"
                      disabled={disabled}
                      {...field}
                      // keep as string; z.coerce will handle conversion/validation
                      onChange={(e) => field.onChange(e.target.value)}
                      className="bg-white"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the whole number of units removed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Requested by */}
            <FormField
              control={form.control}
              name="requestedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requested by</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Name of requester"
                      disabled={disabled}
                      className="bg-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Job Number */}
            <FormField
              control={form.control}
              name="jobNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Number</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="e.g. JOB-12345"
                      disabled={disabled}
                      className="bg-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={disabled || !form.formState.isValid || noItems}>
                {disabled ? "Saving…" : "Record Withdrawal"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => form.reset()}
                disabled={disabled}
              >
                Reset
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

/**
 * Example usage:
 *
 * <StockWithdrawalForm
 *   items={[
 *     { id: "itm_01", name: "1.5mm Steel Sheet", sku: "STL-1.5", uom: "pcs", availableQty: 127 },
 *     { id: "itm_02", name: "M8 Hex Bolt", sku: "BLT-M8", uom: "pcs", availableQty: 420 },
 *     { id: "itm_03", name: "Aluminium Bar 20x20", sku: "ALU-20", uom: "m", availableQty: 73 },
 *   ]}
 *   onSubmit={(payload) => {
 *     // Send to your API
 *     return fetch("/api/stock/withdrawals", {
 *       method: "POST",
 *       headers: { "Content-Type": "application/json" },
 *       body: JSON.stringify(payload),
 *     }).then(() => console.log("Saved!", payload));
 *   }}
 * />
 */

/**
 * ---------------------------
 * TEST CASES (Manual/Visual)
 * ---------------------------
 * 1) Undefined items (should NOT crash; dropdown disabled; submit disabled):
 *    <StockWithdrawalForm onSubmit={(v)=>console.log(v)} />
 *
 * 2) Empty items list (should NOT crash; dropdown disabled; submit disabled):
 *    <StockWithdrawalForm items={[]} onSubmit={(v)=>console.log(v)} />
 *
 * 3) With items (happy path):
 *    <StockWithdrawalForm
 *      items={[
 *        { id: "a", name: "Widget", sku: "W-1", uom: "pcs", availableQty: 10 },
 *        { id: "b", name: "Gizmo", sku: "G-2", uom: "pcs", availableQty: 5 },
 *      ]}
 *      onSubmit={(v)=>console.log(v)}
 *    />
 *
 * 4) Default values preselected (should prefill and still validate):
 *    <StockWithdrawalForm
 *      items={[{ id: "a", name: "Widget" }]}
 *      defaultValues={{ stockItemId: "a", quantity: 2, requestedBy: "Alex", jobNumber: "JOB-99" }}
 *      onSubmit={(v)=>console.log(v)}
 *    />
 */

