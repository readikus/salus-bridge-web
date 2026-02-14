"use client";

import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchImportEmployees } from "@/actions/employees";
import { ImportResult, ErrorRow, SkippedRow, UnmatchedManager } from "@/schemas/csv-import";

interface Props {
  organisationId: string;
  onComplete?: () => void;
}

type WizardStep = "upload" | "importing" | "results";

export function CsvImportWizard({ organisationId, onComplete }: Props) {
  const [step, setStep] = useState<WizardStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setHasError("Please select a .csv file");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setHasError("File must be under 5MB");
      return;
    }
    setFile(selectedFile);
    setHasError(null);
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

  const handleImport = useCallback(async () => {
    if (!file) return;

    setIsLoading(true);
    setHasError(null);
    setStep("importing");

    try {
      const importResult = await fetchImportEmployees(file);
      setResult(importResult);
      setStep("results");
    } catch (error: any) {
      setHasError(error.message || "Import failed");
      setStep("upload");
    } finally {
      setIsLoading(false);
    }
  }, [file]);

  const handleReset = useCallback(() => {
    setFile(null);
    setResult(null);
    setHasError(null);
    setStep("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  if (step === "importing") {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
            <p className="text-sm text-gray-500">Importing employees from {file?.name}...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "results" && result) {
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{result.created.length}</div>
              <div className="text-sm text-gray-500">Created</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{result.skippedDuplicates.length}</div>
              <div className="text-sm text-gray-500">Skipped (Duplicates)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{result.errors.length}</div>
              <div className="text-sm text-gray-500">Errors</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{result.unmatchedManagers.length}</div>
              <div className="text-sm text-gray-500">Unmatched Managers</div>
            </CardContent>
          </Card>
        </div>

        {/* Created Employees */}
        {result.created.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Successfully Created</CardTitle>
              <CardDescription>{result.created.length} employees imported</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="border-b text-left text-gray-500">
                    <tr>
                      <th className="pb-2 pr-4">Name</th>
                      <th className="pb-2 pr-4">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.created.map((emp) => (
                      <tr key={emp.id} className="border-b border-gray-50">
                        <td className="py-2 pr-4">
                          {emp.firstName} {emp.lastName}
                        </td>
                        <td className="py-2 pr-4 text-gray-500">{emp.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Skipped Duplicates */}
        {result.skippedDuplicates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Skipped Duplicates</CardTitle>
              <CardDescription>These employees already exist</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="border-b text-left text-gray-500">
                    <tr>
                      <th className="pb-2 pr-4">Row</th>
                      <th className="pb-2 pr-4">Email</th>
                      <th className="pb-2 pr-4">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.skippedDuplicates.map((row: SkippedRow, idx: number) => (
                      <tr key={idx} className="border-b border-gray-50">
                        <td className="py-2 pr-4">{row.rowNumber}</td>
                        <td className="py-2 pr-4">{row.email}</td>
                        <td className="py-2 pr-4 text-gray-500">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Errors */}
        {result.errors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Errors</CardTitle>
              <CardDescription>These rows could not be imported</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="border-b text-left text-gray-500">
                    <tr>
                      <th className="pb-2 pr-4">Row</th>
                      <th className="pb-2 pr-4">Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((row: ErrorRow, idx: number) => (
                      <tr key={idx} className="border-b border-gray-50">
                        <td className="py-2 pr-4">{row.rowNumber}</td>
                        <td className="py-2 pr-4 text-red-600">{row.errors.join("; ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Unmatched Managers */}
        {result.unmatchedManagers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Unmatched Manager References</CardTitle>
              <CardDescription>These manager emails were not found</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="border-b text-left text-gray-500">
                    <tr>
                      <th className="pb-2 pr-4">Row</th>
                      <th className="pb-2 pr-4">Employee</th>
                      <th className="pb-2 pr-4">Manager Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.unmatchedManagers.map((row: UnmatchedManager, idx: number) => (
                      <tr key={idx} className="border-b border-gray-50">
                        <td className="py-2 pr-4">{row.rowNumber}</td>
                        <td className="py-2 pr-4">{row.employeeEmail}</td>
                        <td className="py-2 pr-4 text-orange-600">{row.managerEmail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleReset} variant="outline">
            Import Another File
          </Button>
          {onComplete && (
            <Button onClick={onComplete}>Done</Button>
          )}
        </div>
      </div>
    );
  }

  // Upload step
  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Employees from CSV</CardTitle>
        <CardDescription>
          Upload a CSV file with employee data. Required columns: first_name, last_name, email. Optional: job_title,
          department, manager_email.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            isDragOver ? "border-gray-900 bg-gray-50" : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <svg className="mb-3 h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">Click to upload</span> or drag and drop
          </p>
          <p className="mt-1 text-xs text-gray-400">CSV files only, max 5MB</p>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleInputChange} className="hidden" />
        </div>

        {/* Selected File */}
        {file && (
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
            <div className="flex items-center space-x-3">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
            >
              Remove
            </Button>
          </div>
        )}

        {/* Error Message */}
        {hasError && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{hasError}</div>
        )}

        {/* Import Button */}
        <Button onClick={handleImport} disabled={!file || isLoading} className="w-full">
          {isLoading ? "Importing..." : "Import Employees"}
        </Button>

        {/* CSV Template Guide */}
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="mb-2 text-sm font-medium text-gray-700">CSV Format</p>
          <code className="block whitespace-pre-wrap text-xs text-gray-500">
            first_name,last_name,email,job_title,department,manager_email{"\n"}
            John,Doe,john@example.com,Engineer,Engineering,jane@example.com{"\n"}
            Jane,Smith,jane@example.com,Manager,Engineering,
          </code>
        </div>
      </CardContent>
    </Card>
  );
}
