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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

interface AddServiceDialogProps {
  onAdd?: (service: { name: string; url: string; type: string; interval: string }) => void;
}

export function AddServiceDialog({ onAdd }: AddServiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("api");
  const [interval, setInterval] = useState("60");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Adding service:", { name, url, type, interval });
    if (onAdd) {
      onAdd({ name, url, type, interval });
    }
    setOpen(false);
    setName("");
    setUrl("");
    setType("api");
    setInterval("60");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-service">
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="dialog-add-service">
        <DialogHeader>
          <DialogTitle>Add New Service</DialogTitle>
          <DialogDescription>
            Configure a new service to monitor for uptime and performance.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service-name">Service Name</Label>
            <Input
              id="service-name"
              placeholder="API Server"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              data-testid="input-service-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-url">Endpoint URL</Label>
            <Input
              id="service-url"
              type="url"
              placeholder="https://api.example.com/health"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              data-testid="input-service-url"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-type">Service Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="service-type" data-testid="select-service-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="database">Database</SelectItem>
                <SelectItem value="cdn">CDN</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="check-interval">Check Interval</Label>
            <Select value={interval} onValueChange={setInterval}>
              <SelectTrigger id="check-interval" data-testid="select-check-interval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 seconds</SelectItem>
                <SelectItem value="60">1 minute</SelectItem>
                <SelectItem value="300">5 minutes</SelectItem>
                <SelectItem value="600">10 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button type="submit" data-testid="button-submit">
              Add Service
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
