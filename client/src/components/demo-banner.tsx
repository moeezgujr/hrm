import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function DemoBanner() {
  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50 text-blue-800">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <strong>Demo Mode:</strong> This is a demonstration of the Meeting Matters Business Management System. 
        All data shown is sample data for showcase purposes. 
        Contact your administrator to connect to live data.
      </AlertDescription>
    </Alert>
  );
}