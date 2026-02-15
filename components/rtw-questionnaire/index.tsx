"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
import { fetchCompleteRtwMeeting } from "@/actions/rtw-meetings";
import { FunctionalEffect } from "@/constants/sickness-states";

const FUNCTIONAL_EFFECT_LABELS: Record<string, string> = {
  [FunctionalEffect.PHASED_RETURN]: "Phased return",
  [FunctionalEffect.ALTERED_HOURS]: "Altered hours",
  [FunctionalEffect.AMENDED_DUTIES]: "Amended duties",
  [FunctionalEffect.ADAPTED_WORKPLACE]: "Adapted workplace",
};

interface Adjustment {
  type: string;
  description: string;
  reviewDate: string;
}

interface Props {
  caseId: string;
  meetingId: string;
  onComplete: () => void;
}

/**
 * Structured RTW questionnaire for conducting return-to-work meetings.
 * Captures questionnaire responses, outcomes, and workplace adjustments.
 */
export function RtwQuestionnaire({ caseId, meetingId, onComplete }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Questionnaire responses
  const [feelingAboutReturn, setFeelingAboutReturn] = useState("");
  const [supportNeeded, setSupportNeeded] = useState("");
  const [workloadConcerns, setWorkloadConcerns] = useState("");
  const [selectedAdjustmentTypes, setSelectedAdjustmentTypes] = useState<string[]>([]);
  const [adjustmentFreeText, setAdjustmentFreeText] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Outcomes
  const [meetingOutcomes, setMeetingOutcomes] = useState("");

  // Agreed adjustments
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);

  const handleToggleAdjustmentType = (type: string) => {
    setSelectedAdjustmentTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const handleAddAdjustment = () => {
    setAdjustments((prev) => [...prev, { type: "", description: "", reviewDate: "" }]);
  };

  const handleRemoveAdjustment = (index: number) => {
    setAdjustments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateAdjustment = (index: number, field: keyof Adjustment, value: string) => {
    setAdjustments((prev) => prev.map((adj, i) => (i === index ? { ...adj, [field]: value } : adj)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setHasError(null);

    try {
      const questionnaireResponses = {
        feelingAboutReturn,
        supportNeeded,
        workloadConcerns,
        adjustmentTypes: selectedAdjustmentTypes,
        adjustmentFreeText,
        additionalNotes,
      };

      const formattedAdjustments = adjustments
        .filter((adj) => adj.type && adj.description)
        .map((adj) => ({
          type: adj.type,
          description: adj.description,
          ...(adj.reviewDate ? { reviewDate: adj.reviewDate } : {}),
        }));

      await fetchCompleteRtwMeeting(caseId, meetingId, {
        questionnaireResponses,
        outcomes: meetingOutcomes,
        adjustments: formattedAdjustments,
      });

      setSuccessMessage("RTW meeting completed successfully. The case has been updated.");
      onComplete();

      setTimeout(() => {
        router.push(`/sickness/${caseId}`);
      }, 2000);
    } catch (err: any) {
      setHasError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-6 flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Return-to-Work Questionnaire</h2>
      </div>

      {hasError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {hasError}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: How are you feeling? */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">
            1. How are you feeling about returning?
          </label>
          <p className="mb-2 text-xs text-gray-500">
            Record the employee's response. Do not pressure them to share medical details.
          </p>
          <textarea
            value={feelingAboutReturn}
            onChange={(e) => setFeelingAboutReturn(e.target.value)}
            rows={3}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Employee's response..."
          />
        </div>

        {/* Section 2: Support needed */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">
            2. Is there anything we should be aware of to support your return?
          </label>
          <p className="mb-2 text-xs text-gray-500">
            Focus on what support they need, not details of their condition.
          </p>
          <textarea
            value={supportNeeded}
            onChange={(e) => setSupportNeeded(e.target.value)}
            rows={3}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Support needs..."
          />
        </div>

        {/* Section 3: Workload concerns */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">
            3. Do you have any concerns about your workload or duties?
          </label>
          <textarea
            value={workloadConcerns}
            onChange={(e) => setWorkloadConcerns(e.target.value)}
            rows={3}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Workload concerns..."
          />
        </div>

        {/* Section 4: Adjustments checklist */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">
            4. Would any of these adjustments help?
          </label>
          <p className="mb-2 text-xs text-gray-500">Select any that apply and add details below.</p>
          <div className="mb-3 space-y-2">
            {Object.entries(FUNCTIONAL_EFFECT_LABELS).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedAdjustmentTypes.includes(value)}
                  onChange={() => handleToggleAdjustmentType(value)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
          <textarea
            value={adjustmentFreeText}
            onChange={(e) => setAdjustmentFreeText(e.target.value)}
            rows={2}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Any other adjustments or additional details..."
          />
        </div>

        {/* Section 5: Anything else */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">
            5. Is there anything else you'd like to discuss?
          </label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            rows={3}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Additional notes..."
          />
        </div>

        {/* Divider */}
        <hr className="border-gray-200" />

        {/* Meeting Outcomes */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">Meeting Outcomes</label>
          <p className="mb-2 text-xs text-gray-500">
            Summarise the key points and decisions from the meeting.
          </p>
          <textarea
            value={meetingOutcomes}
            onChange={(e) => setMeetingOutcomes(e.target.value)}
            rows={4}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Key outcomes and decisions..."
          />
        </div>

        {/* Agreed Adjustments */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-900">Agreed Adjustments</label>
            <button
              type="button"
              onClick={handleAddAdjustment}
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <Plus className="h-3 w-3" />
              Add Adjustment
            </button>
          </div>

          {adjustments.length === 0 && (
            <p className="text-sm text-gray-500">No adjustments added. Click "Add Adjustment" to record agreed workplace adjustments.</p>
          )}

          <div className="space-y-3">
            {adjustments.map((adj, idx) => (
              <div key={idx} className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <div className="mb-2 flex items-start justify-between">
                  <span className="text-xs font-medium text-gray-500">Adjustment {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAdjustment(idx)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mb-2">
                  <label className="mb-1 block text-xs font-medium text-gray-700">Type</label>
                  <select
                    value={adj.type}
                    onChange={(e) => handleUpdateAdjustment(idx, "type", e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select type...</option>
                    {Object.entries(FUNCTIONAL_EFFECT_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="mb-2">
                  <label className="mb-1 block text-xs font-medium text-gray-700">Description</label>
                  <input
                    type="text"
                    value={adj.description}
                    onChange={(e) => handleUpdateAdjustment(idx, "description", e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Describe the adjustment..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Review Date (optional)</label>
                  <input
                    type="date"
                    value={adj.reviewDate}
                    onChange={(e) => handleUpdateAdjustment(idx, "reviewDate", e.target.value)}
                    className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Completing..." : "Complete RTW Meeting"}
          </button>
        </div>
      </form>
    </div>
  );
}
