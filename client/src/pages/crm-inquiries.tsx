import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Download, Search, Filter, Clock, Phone, Mail, FileText, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

type CrmInquiry = {
  id: number;
  name: string;
  callDuration: number;
  inquiryTime: Date;
  responseTime: Date | null;
  attendant: string;
  inquirySource: 'whatsapp_message' | 'whatsapp_call' | 'whatsapp' | 'email' | 'call' | 'job';
  inquiryType: string;
  contact: string;
  status: 'positive' | 'negative' | 'no_response' | 'in_progress' | 'applied' | 'booked';
  notes: string | null;
  createdAt: Date;
  creator: {
    id: number;
    username: string;
  };
};

const statusColors = {
  positive: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  negative: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  no_response: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  applied: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  booked: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

const sourceIcons: Record<string, any> = {
  whatsapp_message: Phone,
  whatsapp_call: Phone,
  whatsapp: Phone, // Backward compatibility
  email: Mail,
  call: Phone,
  job: FileText,
};

const sourceLabels: Record<string, string> = {
  whatsapp_message: 'WhatsApp Message',
  whatsapp_call: 'WhatsApp Call',
  whatsapp: 'WhatsApp', // Backward compatibility
  email: 'Email',
  call: 'Call',
  job: 'Job',
};

// Helper function to get today's date range
const getTodayDateRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  return {
    start: `${year}-${month}-${day}T00:00`,
    end: `${year}-${month}-${day}T23:59`
  };
};

export default function CrmInquiries() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<CrmInquiry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  
  // Set default date filters to today's range
  const todayRange = getTodayDateRange();
  const [dateFromFilter, setDateFromFilter] = useState<string>(todayRange.start);
  const [dateToFilter, setDateToFilter] = useState<string>(todayRange.end);
  const [sortBy, setSortBy] = useState<string>("time_asc");

  const [formData, setFormData] = useState<{
    name: string;
    callDuration: number;
    inquiryTime: string;
    responseTime: string;
    attendant: string;
    inquirySource: 'whatsapp_message' | 'whatsapp_call' | 'whatsapp' | 'email' | 'call' | 'job';
    inquiryType: string;
    contact: string;
    status: 'positive' | 'negative' | 'no_response' | 'in_progress' | 'applied' | 'booked';
    notes: string;
  }>({
    name: "",
    callDuration: 0,
    inquiryTime: new Date().toISOString().slice(0, 16),
    responseTime: "",
    attendant: "",
    inquirySource: "whatsapp_message",
    inquiryType: "",
    contact: "",
    status: "in_progress",
    notes: "",
  });

  // Build query params for filters
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (sourceFilter !== "all") params.append("source", sourceFilter);
    if (dateFromFilter) params.append("dateFrom", dateFromFilter);
    if (dateToFilter) params.append("dateTo", dateToFilter);
    return params.toString();
  };

  const { data: inquiries = [], isLoading } = useQuery<CrmInquiry[]>({
    queryKey: ['/api/crm-inquiries', statusFilter, sourceFilter, dateFromFilter, dateToFilter],
    queryFn: async () => {
      const queryParams = buildQueryParams();
      const response = await fetch(`/api/crm-inquiries${queryParams ? `?${queryParams}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch inquiries');
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest('POST', '/api/crm-inquiries', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm-inquiries'] });
      toast({ title: "Inquiry added successfully" });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to add inquiry", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      return await apiRequest('PUT', `/api/crm-inquiries/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm-inquiries'] });
      toast({ title: "Inquiry updated successfully" });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update inquiry", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/crm-inquiries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm-inquiries'] });
      toast({ title: "Inquiry deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete inquiry", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      callDuration: 0,
      inquiryTime: new Date().toISOString().slice(0, 16),
      responseTime: "",
      attendant: "",
      inquirySource: "whatsapp_message",
      inquiryType: "",
      contact: "",
      status: "in_progress",
      notes: "",
    });
    setSelectedInquiry(null);
  };

  const handleEdit = (inquiry: CrmInquiry) => {
    setSelectedInquiry(inquiry);
    setFormData({
      name: inquiry.name,
      callDuration: inquiry.callDuration,
      inquiryTime: new Date(inquiry.inquiryTime).toISOString().slice(0, 16),
      responseTime: inquiry.responseTime ? new Date(inquiry.responseTime).toISOString().slice(0, 16) : "",
      attendant: inquiry.attendant,
      inquirySource: inquiry.inquirySource,
      inquiryType: inquiry.inquiryType,
      contact: inquiry.contact,
      status: inquiry.status,
      notes: inquiry.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch('/api/crm-inquiries/download/csv');
      if (!response.ok) throw new Error('Failed to download');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crm_inquiries_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "Download started successfully" });
    } catch (error) {
      toast({ title: "Failed to download inquiries", variant: "destructive" });
    }
  };

  const filteredInquiries = inquiries
    .filter(inquiry => {
      const searchLower = searchTerm.toLowerCase();
      return (
        inquiry.name.toLowerCase().includes(searchLower) ||
        inquiry.attendant.toLowerCase().includes(searchLower) ||
        inquiry.contact.toLowerCase().includes(searchLower) ||
        inquiry.inquiryType.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      if (sortBy === "time_asc") {
        return new Date(a.inquiryTime).getTime() - new Date(b.inquiryTime).getTime();
      } else if (sortBy === "time_desc") {
        return new Date(b.inquiryTime).getTime() - new Date(a.inquiryTime).getTime();
      }
      return 0;
    });

  // Calculate comprehensive analytics
  const calculateAverageResponseTime = () => {
    const inquiriesWithResponse = inquiries.filter(i => i.responseTime && i.inquiryTime);
    if (inquiriesWithResponse.length === 0) return "N/A";
    
    const totalMinutes = inquiriesWithResponse.reduce((sum, inquiry) => {
      const inquiryTime = new Date(inquiry.inquiryTime).getTime();
      const responseTime = new Date(inquiry.responseTime!).getTime();
      const diffMinutes = (responseTime - inquiryTime) / (1000 * 60);
      return sum + diffMinutes;
    }, 0);
    
    const avgMinutes = totalMinutes / inquiriesWithResponse.length;
    const hours = Math.floor(avgMinutes / 60);
    const minutes = Math.floor(avgMinutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const stats = {
    total: inquiries.length,
    positive: inquiries.filter(i => i.status === 'positive').length,
    negative: inquiries.filter(i => i.status === 'negative').length,
    inProgress: inquiries.filter(i => i.status === 'in_progress').length,
    booked: inquiries.filter(i => i.status === 'booked').length,
    noResponse: inquiries.filter(i => i.status === 'no_response').length,
    applied: inquiries.filter(i => i.status === 'applied').length,
    
    // Source breakdown
    whatsapp: inquiries.filter(i => i.inquirySource === 'whatsapp_message' || i.inquirySource === 'whatsapp_call' || i.inquirySource === 'whatsapp').length,
    email: inquiries.filter(i => i.inquirySource === 'email').length,
    call: inquiries.filter(i => i.inquirySource === 'call').length,
    job: inquiries.filter(i => i.inquirySource === 'job').length,
    
    // Response rate
    responseRate: inquiries.length > 0 
      ? Math.round((inquiries.filter(i => i.responseTime).length / inquiries.length) * 100)
      : 0,
      
    // Average response time
    avgResponseTime: calculateAverageResponseTime(),
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">CRM Inquiry Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track and manage customer inquiries</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleDownload} variant="outline" data-testid="button-download-inquiries">
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-inquiry">
            <Plus className="h-4 w-4 mr-2" />
            Add Inquiry
          </Button>
        </div>
      </div>

      {/* Date Range Indicator */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                Showing data for:
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">
                {dateFromFilter && dateToFilter ? (
                  (() => {
                    const fromDate = new Date(dateFromFilter);
                    const toDate = new Date(dateToFilter);
                    const fromDateStr = format(fromDate, 'MMM d, yyyy');
                    const toDateStr = format(toDate, 'MMM d, yyyy');
                    const fromTimeStr = format(fromDate, 'h:mm a');
                    const toTimeStr = format(toDate, 'h:mm a');
                    
                    if (fromDateStr === toDateStr) {
                      // Same day
                      if (fromTimeStr === '12:00 AM' && toTimeStr === '11:59 PM') {
                        return `${fromDateStr} (Full Day)`;
                      }
                      return `${fromDateStr} (${fromTimeStr} - ${toTimeStr})`;
                    }
                    return `${fromDateStr} ${fromTimeStr} - ${toDateStr} ${toTimeStr}`;
                  })()
                ) : (
                  'All Time'
                )}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Use filters below to change date range
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Inquiries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.avgResponseTime}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Response Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.responseRate}%</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {inquiries.filter(i => i.responseTime).length} of {stats.total} responded
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Booked Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats.total > 0 ? Math.round((stats.booked / stats.total) * 100) : 0}%
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.booked} of {stats.total} booked
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="flex flex-col">
                <span className="text-sm text-gray-600 dark:text-gray-400">Positive</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-green-600">{stats.positive}</span>
                  <span className="text-xs text-gray-500">
                    ({stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-600 dark:text-gray-400">Negative</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-red-600">{stats.negative}</span>
                  <span className="text-xs text-gray-500">
                    ({stats.total > 0 ? Math.round((stats.negative / stats.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-600 dark:text-gray-400">In Progress</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-blue-600">{stats.inProgress}</span>
                  <span className="text-xs text-gray-500">
                    ({stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-600 dark:text-gray-400">Booked</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-yellow-600">{stats.booked}</span>
                  <span className="text-xs text-gray-500">
                    ({stats.total > 0 ? Math.round((stats.booked / stats.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-600 dark:text-gray-400">Applied</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-purple-600">{stats.applied}</span>
                  <span className="text-xs text-gray-500">
                    ({stats.total > 0 ? Math.round((stats.applied / stats.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-600 dark:text-gray-400">No Response</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-600">{stats.noResponse}</span>
                  <span className="text-xs text-gray-500">
                    ({stats.total > 0 ? Math.round((stats.noResponse / stats.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Source Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Inquiry Source Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Phone className="h-6 w-6 text-green-600 mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">WhatsApp</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-green-600">{stats.whatsapp}</span>
                  <span className="text-xs text-gray-500">
                    ({stats.total > 0 ? Math.round((stats.whatsapp / stats.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Mail className="h-6 w-6 text-blue-600 mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Email</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-blue-600">{stats.email}</span>
                  <span className="text-xs text-gray-500">
                    ({stats.total > 0 ? Math.round((stats.email / stats.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Phone className="h-6 w-6 text-purple-600 mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Call</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-purple-600">{stats.call}</span>
                  <span className="text-xs text-gray-500">
                    ({stats.total > 0 ? Math.round((stats.call / stats.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600 mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Job</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-orange-600">{stats.job}</span>
                  <span className="text-xs text-gray-500">
                    ({stats.total > 0 ? Math.round((stats.job / stats.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                (Showing today's data by default)
              </span>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = getTodayDateRange();
                  setDateFromFilter(today.start);
                  setDateToFilter(today.end);
                  setStatusFilter("all");
                  setSourceFilter("all");
                  setSearchTerm("");
                }}
                data-testid="button-reset-today"
              >
                Reset to Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDateFromFilter("");
                  setDateToFilter("");
                  setStatusFilter("all");
                  setSourceFilter("all");
                  setSearchTerm("");
                }}
                data-testid="button-clear-filters"
              >
                View All Data
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, attendant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-inquiries"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="no_response">No Response</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="source-filter">Source</Label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger id="source-filter" data-testid="select-source-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="whatsapp_message">WhatsApp Message</SelectItem>
                  <SelectItem value="whatsapp_call">WhatsApp Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="job">Job</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sort-by">Sort By Time</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort-by" data-testid="select-sort-by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time_asc">Earliest First</SelectItem>
                  <SelectItem value="time_desc">Latest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>From Date & Time</Label>
              <DateTimePicker
                value={dateFromFilter}
                onChange={setDateFromFilter}
                placeholder="Select start date & time"
                data-testid="input-date-from"
              />
            </div>
            <div>
              <Label>To Date & Time</Label>
              <DateTimePicker
                value={dateToFilter}
                onChange={setDateToFilter}
                placeholder="Select end date & time"
                data-testid="input-date-to"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inquiries Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Inquiries</CardTitle>
          <CardDescription>View and manage all customer inquiries</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading inquiries...</div>
          ) : filteredInquiries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No inquiries found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Attendant</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Inquiry Time</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInquiries.map((inquiry) => {
                    const SourceIcon = sourceIcons[inquiry.inquirySource];
                    
                    // Calculate response time difference
                    const getResponseTimeDiff = () => {
                      if (!inquiry.responseTime) {
                        return { display: 'Not responded', color: 'text-gray-500' };
                      }
                      
                      const inquiryTime = new Date(inquiry.inquiryTime).getTime();
                      const responseTime = new Date(inquiry.responseTime).getTime();
                      const diffMinutes = Math.floor((responseTime - inquiryTime) / (1000 * 60));
                      
                      if (diffMinutes < 0) {
                        return { display: 'Invalid', color: 'text-red-500' };
                      }
                      
                      const hours = Math.floor(diffMinutes / 60);
                      const minutes = diffMinutes % 60;
                      
                      let display = '';
                      let color = '';
                      
                      if (diffMinutes < 30) {
                        color = 'text-green-600 font-semibold';
                      } else if (diffMinutes < 120) {
                        color = 'text-yellow-600';
                      } else {
                        color = 'text-orange-600';
                      }
                      
                      if (hours > 0) {
                        display = `${hours}h ${minutes}m`;
                      } else {
                        display = `${minutes}m`;
                      }
                      
                      return { display, color };
                    };
                    
                    const responseTimeDiff = getResponseTimeDiff();
                    
                    return (
                      <TableRow key={inquiry.id} data-testid={`row-inquiry-${inquiry.id}`}>
                        <TableCell className="font-medium" data-testid={`text-name-${inquiry.id}`}>{inquiry.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <SourceIcon className="h-4 w-4" />
                            <span>{sourceLabels[inquiry.inquirySource] || inquiry.inquirySource}</span>
                          </div>
                        </TableCell>
                        <TableCell>{inquiry.inquiryType}</TableCell>
                        <TableCell>{inquiry.attendant}</TableCell>
                        <TableCell>{inquiry.contact}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[inquiry.status]}>
                            {inquiry.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {inquiry.callDuration} min
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const date = new Date(inquiry.inquiryTime);
                            const year = date.getUTCFullYear();
                            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                            const day = String(date.getUTCDate()).padStart(2, '0');
                            const hours = String(date.getUTCHours()).padStart(2, '0');
                            const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                            return `${year}-${month}-${day} ${hours}:${minutes}`;
                          })()}
                        </TableCell>
                        <TableCell>
                          {inquiry.responseTime ? (
                            <div className="flex flex-col gap-1">
                              <div className="text-sm">
                                {(() => {
                                  const date = new Date(inquiry.responseTime);
                                  const year = date.getUTCFullYear();
                                  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                                  const day = String(date.getUTCDate()).padStart(2, '0');
                                  const hours = String(date.getUTCHours()).padStart(2, '0');
                                  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                                  return `${year}-${month}-${day} ${hours}:${minutes}`;
                                })()}
                              </div>
                              <div className={`flex items-center gap-1 ${responseTimeDiff.color} text-xs`}>
                                <Clock className="h-3 w-3" />
                                {responseTimeDiff.display}
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-500 text-sm">Not responded</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md text-sm whitespace-normal" data-testid={`text-notes-${inquiry.id}`}>
                            {inquiry.notes || <span className="text-gray-400 italic">No notes</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(inquiry)}
                              data-testid={`button-edit-${inquiry.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this inquiry?')) {
                                  deleteMutation.mutate(inquiry.id);
                                }
                              }}
                              data-testid={`button-delete-${inquiry.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditDialogOpen ? 'Edit Inquiry' : 'Add New Inquiry'}</DialogTitle>
            <DialogDescription>
              {isEditDialogOpen ? 'Update inquiry details' : 'Record a new customer inquiry'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Customer name"
                data-testid="input-name"
              />
            </div>
            <div>
              <Label htmlFor="attendant">Attendant *</Label>
              <Input
                id="attendant"
                value={formData.attendant}
                onChange={(e) => setFormData({ ...formData, attendant: e.target.value })}
                placeholder="Employee name"
                data-testid="input-attendant"
              />
            </div>
            <div>
              <Label htmlFor="inquiry-source">Source *</Label>
              <Select
                value={formData.inquirySource}
                onValueChange={(value: any) => setFormData({ ...formData, inquirySource: value })}
              >
                <SelectTrigger id="inquiry-source" data-testid="select-inquiry-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp_message">WhatsApp Message</SelectItem>
                  <SelectItem value="whatsapp_call">WhatsApp Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="job">Job</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="inquiry-type">Type *</Label>
              <Input
                id="inquiry-type"
                value={formData.inquiryType}
                onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                placeholder="e.g., Product inquiry, Support"
                data-testid="input-inquiry-type"
              />
            </div>
            <div>
              <Label htmlFor="contact">Contact *</Label>
              <Input
                id="contact"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="Phone or email"
                data-testid="input-contact"
              />
            </div>
            <div>
              <Label htmlFor="call-duration">Call Duration (minutes) *</Label>
              <Input
                id="call-duration"
                type="number"
                value={formData.callDuration}
                onChange={(e) => setFormData({ ...formData, callDuration: parseInt(e.target.value) || 0 })}
                min="0"
                data-testid="input-call-duration"
              />
            </div>
            <div>
              <Label htmlFor="inquiry-time">Inquiry Time *</Label>
              <Input
                id="inquiry-time"
                type="datetime-local"
                value={formData.inquiryTime}
                onChange={(e) => setFormData({ ...formData, inquiryTime: e.target.value })}
                data-testid="input-inquiry-time"
              />
            </div>
            <div>
              <Label htmlFor="response-time">Response Time</Label>
              <Input
                id="response-time"
                type="datetime-local"
                value={formData.responseTime}
                onChange={(e) => setFormData({ ...formData, responseTime: e.target.value })}
                data-testid="input-response-time"
              />
            </div>
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="no_response">No Response</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes or comments"
                rows={3}
                data-testid="input-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
                resetForm();
              }}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (isEditDialogOpen && selectedInquiry) {
                  updateMutation.mutate({ id: selectedInquiry.id, data: formData });
                } else {
                  createMutation.mutate(formData);
                }
              }}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-submit-inquiry"
            >
              {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : (isEditDialogOpen ? 'Update' : 'Add')} Inquiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
