"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataSubjectRecord, AuditLog } from "@/types/database";

interface Props {
  data: DataSubjectRecord;
}

function formatDate(date: Date | string | null): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAction(action: string): string {
  return action.charAt(0) + action.slice(1).toLowerCase();
}

function formatEntity(entity: string): string {
  return entity.charAt(0) + entity.slice(1).toLowerCase().replace(/_/g, " ");
}

export function DataSubjectView({ data }: Props) {
  const { personalInfo, roles, activityLog } = data;

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Data held about you in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Full Name</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {personalInfo.firstName && personalInfo.lastName
                  ? `${personalInfo.firstName} ${personalInfo.lastName}`
                  : "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{personalInfo.email || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Job Title</dt>
              <dd className="mt-1 text-sm text-gray-900">{personalInfo.jobTitle || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Department</dt>
              <dd className="mt-1 text-sm text-gray-900">{personalInfo.departmentName || "Not assigned"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Manager</dt>
              <dd className="mt-1 text-sm text-gray-900">{personalInfo.managerName || "Not assigned"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <Badge variant={personalInfo.status === "ACTIVE" ? "success" : "secondary"}>
                  {personalInfo.status}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Account Created</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(personalInfo.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(personalInfo.updatedAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Roles & Access */}
      <Card>
        <CardHeader>
          <CardTitle>Roles & Access</CardTitle>
          <CardDescription>Your permissions across organisations</CardDescription>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <p className="text-sm text-gray-500">No roles assigned</p>
          ) : (
            <div className="space-y-3">
              {roles.map((role, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div>
                    <Badge variant="secondary">{role.role}</Badge>
                    <span className="ml-2 text-sm text-gray-500">{role.organisationName}</span>
                  </div>
                  {role.createdAt && <span className="text-xs text-gray-400">Since {formatDate(role.createdAt)}</span>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Recent system actions related to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {activityLog.length === 0 ? (
            <p className="text-sm text-gray-500">No activity recorded</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-gray-500">
                  <tr>
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Action</th>
                    <th className="pb-2 pr-4">Entity</th>
                    <th className="pb-2 pr-4">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLog.map((entry: AuditLog) => (
                    <tr key={entry.id} className="border-b border-gray-50">
                      <td className="py-2 pr-4 text-gray-500">{formatDate(entry.createdAt)}</td>
                      <td className="py-2 pr-4">
                        <Badge variant="outline" className="text-xs">
                          {formatAction(entry.action)}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4">{formatEntity(entry.entity)}</td>
                      <td className="py-2 pr-4 text-gray-500">
                        {entry.metadata && typeof entry.metadata === "object" && (entry.metadata as Record<string, unknown>).event
                          ? String((entry.metadata as Record<string, unknown>).event)
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
