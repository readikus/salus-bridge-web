"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { OhReferralCommunicationWithAuthor } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  communications: OhReferralCommunicationWithAuthor[];
  onAddCommunication: (direction: string, message: string) => Promise<void>;
}

export function CommunicationLog({ communications, onAddCommunication }: Props) {
  const [direction, setDirection] = useState<string>("OUTBOUND");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddCommunication(direction, message.trim());
      setMessage("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Communication Log</h3>

      {communications.length === 0 ? (
        <p className="text-sm text-gray-500">No communications recorded yet.</p>
      ) : (
        <div className="space-y-3">
          {communications.map((comm) => (
            <div key={comm.id} className="flex gap-3 rounded-lg border border-gray-200 p-3">
              <div className="flex-shrink-0 pt-0.5">
                {comm.direction === "OUTBOUND" ? (
                  <ArrowRight className="h-5 w-5 text-blue-500" />
                ) : (
                  <ArrowLeft className="h-5 w-5 text-green-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {comm.authorFirstName} {comm.authorLastName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {comm.direction === "OUTBOUND" ? "To Provider" : "From Provider"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {format(new Date(comm.createdAt), "dd MMM yyyy HH:mm")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{comm.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 border-t border-gray-200 pt-4">
        <div className="space-y-2">
          <Label>Direction</Label>
          <Select value={direction} onValueChange={setDirection}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OUTBOUND">Outbound (To Provider)</SelectItem>
              <SelectItem value="INBOUND">Inbound (From Provider)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows={3}
          />
        </div>

        <Button type="submit" disabled={isSubmitting || !message.trim()} size="sm">
          {isSubmitting ? "Adding..." : "Add Communication"}
        </Button>
      </form>
    </div>
  );
}
