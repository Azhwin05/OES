"use client"

import type { Control, FieldPath, FieldValues } from "react-hook-form"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type Option = { value: string; label: string }

type BaseProps<T extends FieldValues> = {
  control: Control<T>
  name: FieldPath<T>
  label: string
  required?: boolean
  placeholder?: string
  className?: string
}

function LabelLine({ label, required }: { label: string; required?: boolean }) {
  return (
    <FormLabel>
      {label}
      {required && <span className="text-destructive">*</span>}
    </FormLabel>
  )
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  placeholder,
  type = "text",
  inputMode,
}: BaseProps<T> & {
  type?: string
  inputMode?: "text" | "numeric" | "tel" | "email"
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <LabelLine label={label} required={required} />
          <FormControl>
            <Input
              type={type}
              inputMode={inputMode}
              placeholder={placeholder}
              {...field}
              value={(field.value as string | undefined) ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function NumberField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  placeholder,
  min,
  max,
}: BaseProps<T> & { min?: number; max?: number }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <LabelLine label={label} required={required} />
          <FormControl>
            <Input
              type="number"
              inputMode="numeric"
              min={min}
              max={max}
              placeholder={placeholder}
              name={field.name}
              onBlur={field.onBlur}
              value={
                field.value === undefined || field.value === null
                  ? ""
                  : (field.value as number)
              }
              onChange={(e) =>
                field.onChange(
                  e.target.value === "" ? undefined : Number(e.target.value)
                )
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function TextAreaField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  placeholder,
  rows = 3,
}: BaseProps<T> & { rows?: number }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <LabelLine label={label} required={required} />
          <FormControl>
            <Textarea
              rows={rows}
              placeholder={placeholder}
              {...field}
              value={(field.value as string | undefined) ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  placeholder,
  options,
}: BaseProps<T> & { options: Option[] }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <LabelLine label={label} required={required} />
          <Select
            items={options}
            value={(field.value as string | undefined) ?? null}
            onValueChange={(v) => field.onChange(v)}
          >
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function RadioField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  options,
}: BaseProps<T> & { options: Option[] }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <LabelLine label={label} required={required} />
          <FormControl>
            <RadioGroup
              value={(field.value as string | undefined) ?? ""}
              onValueChange={(v) => field.onChange(v)}
              className="flex flex-wrap gap-4 pt-1"
            >
              {options.map((o) => (
                <label
                  key={o.value}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <RadioGroupItem value={o.value} />
                  {o.label}
                </label>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function BooleanRadioField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  yesLabel,
  noLabel,
}: BaseProps<T> & { yesLabel: string; noLabel: string }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <LabelLine label={label} required={required} />
          <FormControl>
            <RadioGroup
              value={field.value === true ? "yes" : field.value === false ? "no" : ""}
              onValueChange={(v) => field.onChange(v === "yes")}
              className="flex flex-wrap gap-4 pt-1"
            >
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <RadioGroupItem value="yes" />
                {yesLabel}
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <RadioGroupItem value="no" />
                {noLabel}
              </label>
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function CheckboxField<T extends FieldValues>({
  control,
  name,
  label,
}: BaseProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center gap-2 space-y-0">
          <FormControl>
            <Checkbox
              checked={!!field.value}
              onCheckedChange={(c) => field.onChange(c === true)}
            />
          </FormControl>
          <FormLabel className="!mt-0 cursor-pointer font-normal">
            {label}
          </FormLabel>
        </FormItem>
      )}
    />
  )
}
