"use client";

import React, { useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createFitNoteSchema, CreateFitNoteInput } from "@/schemas/fit-note";
import { fetchUploadFitNote } from "@/actions/fit-notes";
import { Upload, X, FileText, Loader2 } from "lucide-react";

interface Props {
  caseId: string;
  onUploadComplete: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

const FUNCTIONAL_EFFECT_OPTIONS = [
  { value: "phased_return", label: "Phased return to work" },
  { value: "altered_hours", label: "Altered hours" },
  { value: "amended_duties", label: "Amended duties" },
  { value: "adapted_workplace", label: "Adapted workplace" },
] as const;

export function FitNoteUpload({ caseId, onUploadComplete }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateFitNoteInput>({
    resolver: zodResolver(createFitNoteSchema),
    defaultValues: {
      fitNoteStatus: "NOT_FIT",
      functionalEffects: [],
    },
  });

  const fitNoteStatus = watch("fitNoteStatus");

  const handleFileSelect = useCallback((selectedFile: File) => {
    setHasError(null);
    setSuccessMessage(null);

    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      setHasError("Please select a PDF, JPEG, or PNG file");
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setHasError("File must be under 10MB");
      return;
    }
    setFile(selectedFile);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFileSelect(droppedFile);
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) handleFileSelect(selectedFile);
    },
    [handleFileSelect],
  );

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const onSubmit = useCallback(
    async (data: CreateFitNoteInput) => {
      if (!file) {
        setHasError("Please select a file to upload");
        return;
      }

      setIsLoading(true);
      setHasError(null);
      setSuccessMessage(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("fitNoteStatus", data.fitNoteStatus);
        formData.append("startDate", data.startDate);
        if (data.endDate) {
          formData.append("endDate", data.endDate);
        }
        if (data.functionalEffects && data.functionalEffects.length > 0) {
          formData.append("functionalEffects", JSON.stringify(data.functionalEffects));
        }
        if (data.notes) {
          formData.append("notes", data.notes);
        }

        await fetchUploadFitNote(caseId, formData);

        setSuccessMessage("Fit note uploaded successfully");
        setFile(null);
        reset();
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        onUploadComplete();
      } catch (error: any) {
        setHasError(error.message || "Upload failed");
      } finally {
        setIsLoading(false);
      }
    },
    [file, caseId, onUploadComplete, reset],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Upload Fit Note</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* File drop zone */}
          <div>
            <Label>Document</Label>
            <div
              className={`mt-1 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors ${
                isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                    className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mb-2 h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-gray-500">PDF, JPEG, or PNG (max 10MB)</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleInputChange}
            />
          </div>

          {/* Fit note status */}
          <div>
            <Label>Fit Note Status</Label>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" value="NOT_FIT" {...register("fitNoteStatus")} className="text-blue-600" />
                <span className="text-sm">Not fit for work</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" value="MAY_BE_FIT" {...register("fitNoteStatus")} className="text-blue-600" />
                <span className="text-sm">May be fit for work</span>
              </label>
            </div>
            {errors.fitNoteStatus && <p className="mt-1 text-xs text-red-600">{errors.fitNoteStatus.message}</p>}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" {...register("startDate")} className="mt-1" />
              {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate.message}</p>}
            </div>
            <div>
              <Label htmlFor="endDate">End Date (optional)</Label>
              <Input id="endDate" type="date" {...register("endDate")} className="mt-1" />
              {errors.endDate && <p className="mt-1 text-xs text-red-600">{errors.endDate.message}</p>}
            </div>
          </div>

          {/* Functional effects (only when MAY_BE_FIT) */}
          {fitNoteStatus === "MAY_BE_FIT" && (
            <div>
              <Label>Functional Effects</Label>
              <div className="mt-2 space-y-2">
                {FUNCTIONAL_EFFECT_OPTIONS.map((effect) => (
                  <label key={effect.value} className="flex items-center gap-2">
                    <input type="checkbox" value={effect.value} {...register("functionalEffects")} />
                    <span className="text-sm">{effect.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <textarea
              id="notes"
              {...register("notes")}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Additional notes about this fit note..."
            />
            {errors.notes && <p className="mt-1 text-xs text-red-600">{errors.notes.message}</p>}
          </div>

          {/* Error/success messages */}
          {hasError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{hasError}</div>
          )}
          {successMessage && (
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          {/* Submit */}
          <Button type="submit" disabled={isLoading || !file}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Fit Note
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
