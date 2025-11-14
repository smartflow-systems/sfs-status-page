import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";

interface CreateIncidentDialogProps {
  trigger?: React.ReactNode;
  onCreateIncident?: (incident: {
    title: string;
    severity: string;
    affectedService: string;
    description: string;
  }) => void;
}

export function CreateIncidentDialog({ trigger, onCreateIncident }: CreateIncidentDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState("major");
  const [affectedService, setAffectedService] = useState("api");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating incident:", { title, severity, affectedService, description });
    if (onCreateIncident) {
      onCreateIncident({ title, severity, affectedService, description });
    }
    setOpen(false);
    setTitle("");
    setSeverity("major");
    setAffectedService("api");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" data-testid="button-create-incident">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Report Incident
          </Button>
        )}
      </DialogTrigger>
      <DialogContent data-testid="dialog-create-incident">
        <DialogHeader>
          <DialogTitle>Create Incident</DialogTitle>
          <DialogDescription>
            Report a new incident affecting one or more services.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="incident-title">Incident Title</Label>
            <Input
              id="incident-title"
              placeholder="API Response Time Degradation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              data-testid="input-incident-title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="incident-severity">Severity</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger id="incident-severity" data-testid="select-incident-severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minor">Minor</SelectItem>
                <SelectItem value="major">Major</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="affected-service">Affected Service</Label>
            <Select value={affectedService} onValueChange={setAffectedService}>
              <SelectTrigger id="affected-service" data-testid="select-affected-service">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="api">API Server</SelectItem>
                <SelectItem value="website">Main Website</SelectItem>
                <SelectItem value="database">Database</SelectItem>
                <SelectItem value="cdn">CDN</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="incident-description">Description</Label>
            <Textarea
              id="incident-description"
              placeholder="Describe the incident and its impact..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              data-testid="input-incident-description"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button type="submit" data-testid="button-submit">
              Create Incident
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
