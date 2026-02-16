"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_FIELDS, AppFieldKey } from "@/utils/column-mapping";

interface Props {
  fileHeaders: string[];
  detectedMapping: Record<AppFieldKey, string | null>;
  sampleRows: Record<string, string>[];
  onConfirm: (mapping: Record<AppFieldKey, string | null>) => void;
  onBack: () => void;
}

const NOT_MAPPED_VALUE = "__not_mapped__";

export function ColumnMappingStep({ fileHeaders, detectedMapping, sampleRows, onConfirm, onBack }: Props) {
  const [mapping, setMapping] = useState<Record<AppFieldKey, string | null>>({ ...detectedMapping });

  // Build set of currently used headers (excluding the current field being edited)
  const usedHeaders = useMemo(() => {
    const used = new Set<string>();
    for (const field of APP_FIELDS) {
      const value = mapping[field.key];
      if (value !== null) {
        used.add(value);
      }
    }
    return used;
  }, [mapping]);

  // Check if all required fields are mapped
  const requiredFieldsMapped = useMemo(() => {
    return APP_FIELDS.filter((f) => f.required).every((f) => mapping[f.key] !== null);
  }, [mapping]);

  const handleFieldChange = (fieldKey: AppFieldKey, value: string) => {
    setMapping((prev) => ({
      ...prev,
      [fieldKey]: value === NOT_MAPPED_VALUE ? null : value,
    }));
  };

  const getPreviewValue = (header: string | null): string | null => {
    if (!header || sampleRows.length === 0) return null;
    const value = sampleRows[0][header];
    return value && value.trim() ? value.trim() : null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Map Columns</CardTitle>
        <CardDescription>
          We detected your file's columns. Please verify the mappings below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {APP_FIELDS.map((field) => {
            const currentValue = mapping[field.key];
            const preview = getPreviewValue(currentValue);

            return (
              <div
                key={field.key}
                className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0"
              >
                {/* Left side: field label + required badge */}
                <div className="flex min-w-[160px] items-center gap-2 pt-2">
                  <span className="text-sm font-medium">{field.label}</span>
                  {field.required && (
                    <Badge variant="secondary" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>

                {/* Right side: select dropdown + preview */}
                <div className="flex-1 space-y-1">
                  <Select
                    value={currentValue ?? NOT_MAPPED_VALUE}
                    onValueChange={(val) => handleFieldChange(field.key, val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="-- Not mapped --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NOT_MAPPED_VALUE}>-- Not mapped --</SelectItem>
                      {fileHeaders.map((header) => {
                        const isUsedByOther = usedHeaders.has(header) && currentValue !== header;
                        return (
                          <SelectItem key={header} value={header} disabled={isUsedByOther}>
                            {header}
                            {isUsedByOther ? " (used)" : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {preview && (
                    <p className="text-sm text-muted-foreground">
                      Preview: {preview}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Warning if required fields not mapped */}
        {!requiredFieldsMapped && (
          <div className="mt-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">
            All required fields (First Name, Last Name, Email) must be mapped before you can continue.
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={() => onConfirm(mapping)} disabled={!requiredFieldsMapped}>
          Continue Import
        </Button>
      </CardFooter>
    </Card>
  );
}
