import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "data-testid"?: string;
}

export function DateTimePicker({ value, onChange, placeholder = "Pick a date and time", "data-testid": testId }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  
  // Parse the datetime-local string to Date object
  const selectedDate = value ? new Date(value) : undefined;
  
  // Extract time from the value
  const timeValue = value ? value.split('T')[1] || '00:00' : '00:00';
  
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange('');
      return;
    }
    
    // Combine selected date with current time
    const [hours, minutes] = timeValue.split(':');
    date.setHours(parseInt(hours), parseInt(minutes));
    
    // Format to datetime-local format
    const formattedDate = format(date, "yyyy-MM-dd'T'HH:mm");
    onChange(formattedDate);
  };
  
  const handleTimeChange = (newTime: string) => {
    if (!selectedDate) {
      // If no date selected, use today's date
      const today = new Date();
      const [hours, minutes] = newTime.split(':');
      today.setHours(parseInt(hours), parseInt(minutes));
      const formattedDate = format(today, "yyyy-MM-dd'T'HH:mm");
      onChange(formattedDate);
      return;
    }
    
    const [hours, minutes] = newTime.split(':');
    const newDate = new Date(selectedDate);
    newDate.setHours(parseInt(hours), parseInt(minutes));
    
    const formattedDate = format(newDate, "yyyy-MM-dd'T'HH:mm");
    onChange(formattedDate);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
          data-testid={testId}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            <span>{format(new Date(value), 'MMM d, yyyy h:mm a')}</span>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className="border-t pt-3">
            <Label htmlFor="time-input" className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4" />
              Select Time
            </Label>
            <Input
              id="time-input"
              type="time"
              value={timeValue}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="flex-1"
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
