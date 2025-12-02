import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus, Save, Copy, User, Phone, Mail, MessageCircle, Clock, Trash2, AlertTriangle, RefreshCw, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const sourceIcons: Record<string, any> = {
  whatsapp_message: MessageCircle,
  whatsapp_call: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  call: Phone,
  job: User,
};

const statusColors = {
  positive: 'bg-green-100 text-green-800',
  negative: 'bg-red-100 text-red-800',
  no_response: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  applied: 'bg-purple-100 text-purple-800',
  booked: 'bg-yellow-100 text-yellow-800',
};

export default function CeoCrmMeeting() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedInquiry, setSelectedInquiry] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    totalSessions: 0,
    inductionSessions: 0,
    followUpSessions: 0,
    cancelledRescheduled: 0,
    cancelReason: '',
    totalInquiries: 0,
    newLeads: 0,
    followUps: 0,
    closedDeals: 0,
    callsPlaced: 0,
    callsReceived: 0,
    emailsSent: 0,
    whatsappMessages: 0,
    preCounseling: 0,
    preCounselingNotes: '',
    totalCallDuration: 0,
    averageCallDuration: 0,
    notes: '',
    summary: '',
    sessionNotes: '',
    communicationNotes: '',
    timeMetricsNotes: '',
    criticalClientsNotes: '',
    ceoClientsNotes: '',
    googleReviewsNotes: '',
    criticalClients: [] as Array<{name: string; contact: string; status: string; notes: string}>,
    ceoClients: [] as Array<{name: string; contact: string; followupDate: string; status: string; notes: string}>,
    ceoAvailability: { status: '', availableHours: '', notes: '' },
    googleReviews: [] as Array<{rating: number; reviewText: string; reviewer: string; date: string; notes: string}>,
  });
  
  const [newCriticalClient, setNewCriticalClient] = useState({ name: '', contact: '', status: 'pending', notes: '' });
  const [newCeoClient, setNewCeoClient] = useState({ name: '', contact: '', followupDate: '', status: 'pending', notes: '' });
  const [ceoAvailStatus, setCeoAvailStatus] = useState('');
  const [ceoAvailHours, setCeoAvailHours] = useState('');
  const [ceoAvailNotes, setCeoAvailNotes] = useState('');
  const [ceoSchedule, setCeoSchedule] = useState<Record<string, Array<{startTime: string; endTime: string}>>>({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  });
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [newGoogleReview, setNewGoogleReview] = useState({ rating: 5, reviewText: '', reviewer: '', date: new Date().toISOString().split('T')[0], notes: '' });

  // Fetch today's record if exists
  const { data: todayRecord } = useQuery({
    queryKey: ['/api/crm/daily-meetings', date],
    queryFn: async () => {
      const response = await fetch(`/api/crm/daily-meetings?from=${date}&to=${date}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data[0];
    },
  });

  // Fetch yesterday's record to compare status changes
  const { data: yesterdayRecord } = useQuery({
    queryKey: ['/api/crm/daily-meetings', new Date(new Date(date).getTime() - 86400000).toISOString().split('T')[0]],
    queryFn: async () => {
      const yesterday = new Date(new Date(date).getTime() - 86400000).toISOString().split('T')[0];
      const response = await fetch(`/api/crm/daily-meetings?from=${yesterday}&to=${yesterday}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data[0];
    },
  });

  // Fetch all CRM inquiries with creator info
  const { data: inquiries = [] } = useQuery({
    queryKey: ['/api/crm-inquiries'],
    queryFn: async () => {
      const response = await fetch('/api/crm-inquiries');
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Count inquiries from today
  const todayInquiries = useMemo(() => {
    if (!inquiries) return [];
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return inquiries.filter((inq: any) => {
      const inqTime = new Date(inq.inquiryTime);
      return inqTime >= startOfDay && inqTime <= endOfDay;
    });
  }, [inquiries, date]);

  // Get inquiries CREATED BEFORE TODAY with status changes TODAY
  const statusChangedInquiries = useMemo(() => {
    if (!inquiries || !todayRecord || !yesterdayRecord) return [];
    
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const changedInquiries: any[] = [];
    
    // Build map of yesterday's inquiry statuses
    const yesterdayInquiryMap = new Map();
    if (yesterdayRecord?.inquiryData) {
      Object.entries(yesterdayRecord.inquiryData as Record<string, any>).forEach(([key, inqData]: [string, any]) => {
        if (inqData?.status) {
          yesterdayInquiryMap.set(key, inqData.status);
        }
      });
    }
    
    // Check today's inquiries for status changes
    if (todayRecord?.inquiryData) {
      Object.entries(todayRecord.inquiryData as Record<string, any>).forEach(([key, inqData]: [string, any]) => {
        if (inqData?.status) {
          const yesterdayStatus = yesterdayInquiryMap.get(key);
          // Status changed today if: existed yesterday with different status
          if (yesterdayStatus && yesterdayStatus !== inqData.status) {
            const fullInquiry = inquiries.find((inq: any) => inq.id.toString() === key);
            // Only include if inquiry was created BEFORE today
            if (fullInquiry) {
              const inqTime = new Date(fullInquiry.inquiryTime);
              if (inqTime < startOfDay) {
                changedInquiries.push({
                  ...fullInquiry,
                  previousStatus: yesterdayStatus,
                  currentStatus: inqData.status,
                });
              }
            }
          }
        }
      });
    }
    
    return changedInquiries;
  }, [inquiries, todayRecord, yesterdayRecord, date]);

  // Calculate status counts
  const inquiryStats = useMemo(() => {
    const stats = {
      booked: 0,
      in_progress: 0,
      negative: 0,
    };
    todayInquiries.forEach((inq: any) => {
      if (inq.status === 'booked') stats.booked++;
      else if (inq.status === 'in_progress') stats.in_progress++;
      else if (inq.status === 'negative') stats.negative++;
    });
    return stats;
  }, [todayInquiries]);

  // Auto-populate inquiry data - Only fills "New Inquiries" count, not Sessions
  const populateFromInquiries = (silent: boolean = false) => {
    if (todayInquiries.length === 0) {
      if (!silent) {
        toast({ title: 'No Inquiries', description: 'No new inquiries found for this date' });
      }
      return;
    }

    // Only populate the NEW INQUIRIES count - let CRM team add Sessions manually
    setFormData(prev => ({
      ...prev,
      totalInquiries: todayInquiries.length, // Only this gets auto-populated
    }));

    if (!silent) {
      toast({ title: 'Auto-populated', description: `${todayInquiries.length} new inquiries added` });
    }
  };

  // Auto-populate when inquiries are loaded or date changes (only if no existing record)
  useEffect(() => {
    if (todayInquiries.length > 0 && !todayRecord) {
      populateFromInquiries(true); // Silent auto-populate
    }
  }, [todayInquiries, todayRecord, date]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('POST', '/api/crm/daily-meetings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/daily-meetings'] });
      toast({ title: 'Success', description: 'Daily log created successfully' });
      setFormData({
        totalSessions: 0,
        inductionSessions: 0,
        followUpSessions: 0,
        cancelledRescheduled: 0,
        cancelReason: '',
        totalInquiries: 0,
        newLeads: 0,
        followUps: 0,
        closedDeals: 0,
        callsPlaced: 0,
        callsReceived: 0,
        emailsSent: 0,
        whatsappMessages: 0,
        preCounseling: 0,
        preCounselingNotes: '',
        totalCallDuration: 0,
        averageCallDuration: 0,
        notes: '',
        summary: '',
        sessionNotes: '',
        communicationNotes: '',
        timeMetricsNotes: '',
        criticalClientsNotes: '',
        ceoClientsNotes: '',
        googleReviewsNotes: '',
        criticalClients: [],
        ceoClients: [],
        ceoAvailability: { status: '', availableHours: '', notes: '' },
        googleReviews: [],
      });
      setNewCriticalClient({ name: '', contact: '', status: 'pending', notes: '' });
      setNewCeoClient({ name: '', contact: '', followupDate: '', status: 'pending', notes: '' });
      setCeoAvailStatus('');
      setCeoAvailHours('');
      setCeoAvailNotes('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('PATCH', `/api/crm/daily-meetings/${todayRecord.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/daily-meetings'] });
      toast({ title: 'Success', description: 'Daily log updated successfully' });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const conversionRate = formData.closedDeals > 0 
      ? (formData.closedDeals / formData.totalInquiries * 100).toFixed(2)
      : 0;

    // Capture ALL inquiry statuses for status change tracking
    const inquiryData: Record<string, any> = {};
    inquiries.forEach((inq: any) => {
      inquiryData[inq.id] = { status: inq.status };
    });

    const payload = {
      ...formData,
      meetingDate: new Date(date),
      conversionRate: parseFloat(conversionRate as string),
      inquirySourceBreakdown: {},
      inquiryData, // Store all inquiry statuses as snapshot
    };

    if (todayRecord?.id) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Duration') ? parseInt(value) || 0 : parseInt(value) || 0,
    }));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const bookedRate = formData.totalInquiries > 0 
    ? (formData.closedDeals / formData.totalInquiries * 100).toFixed(2)
    : 0;

  // Handlers for Critical Clients
  const addCriticalClient = () => {
    if (!newCriticalClient.name || !newCriticalClient.contact) {
      toast({ title: 'Error', description: 'Please fill in all fields' });
      return;
    }
    setFormData(prev => ({
      ...prev,
      criticalClients: [...prev.criticalClients, newCriticalClient],
    }));
    setNewCriticalClient({ name: '', contact: '', status: 'pending', notes: '' });
    toast({ title: 'Added', description: 'Critical client added' });
  };

  const removeCriticalClient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      criticalClients: prev.criticalClients.filter((_, i) => i !== index),
    }));
  };

  // Handlers for CEO Clients
  const addCeoClient = () => {
    if (!newCeoClient.name || !newCeoClient.contact || !newCeoClient.followupDate) {
      toast({ title: 'Error', description: 'Please fill in all fields' });
      return;
    }
    setFormData(prev => ({
      ...prev,
      ceoClients: [...prev.ceoClients, newCeoClient],
    }));
    setNewCeoClient({ name: '', contact: '', followupDate: '', status: 'pending', notes: '' });
    toast({ title: 'Added', description: 'CEO client added' });
  };

  const removeCeoClient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ceoClients: prev.ceoClients.filter((_, i) => i !== index),
    }));
  };

  // Handler for CEO Availability
  const updateCeoAvailability = () => {
    setFormData(prev => ({
      ...prev,
      ceoAvailability: {
        status: ceoAvailStatus,
        availableHours: ceoAvailHours,
        notes: ceoAvailNotes,
        schedule: ceoSchedule,
      },
    }));
    toast({ title: 'Updated', description: 'CEO availability updated' });
  };

  // Handler to add time slot for a day
  const addTimeSlot = () => {
    if (!startTime || !endTime) {
      toast({ title: 'Error', description: 'Please enter both start and end times' });
      return;
    }
    setCeoSchedule(prev => ({
      ...prev,
      [selectedDay]: [...prev[selectedDay], { startTime, endTime }],
    }));
    setStartTime('');
    setEndTime('');
    toast({ title: 'Added', description: `Time slot added for ${selectedDay}` });
  };

  // Handler to remove time slot
  const removeTimeSlot = (day: string, index: number) => {
    setCeoSchedule(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  const chartData = [
    { name: 'Sessions', value: formData.totalSessions },
    { name: 'Inquiries', value: formData.totalInquiries },
    { name: 'Leads', value: formData.newLeads },
    { name: 'Deals', value: formData.closedDeals },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📊 CRM Daily Meeting Log</h1>
        <p className="text-gray-600 mb-8">Add today's CRM team activities and auto-populate from existing inquiries</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Plus size={20} /> Daily Activity Log - {format(new Date(date), 'MMMM dd, yyyy')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Date Selection */}
                  <div>
                    <Label htmlFor="date">Meeting Date</Label>
                    <Input
                      type="date"
                      id="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  {/* Session Metrics - 4 Separate Boxes */}
                  <div className="space-y-4">
                    {/* Box 1: Today's Sessions */}
                    <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                      <h3 className="font-semibold text-gray-800 text-lg mb-3 flex items-center gap-2">
                        📞 Today's Sessions
                      </h3>
                      <div>
                        <Label htmlFor="totalSessions">Total Sessions</Label>
                        <p className="text-xs text-gray-500 mb-1">Add manually by your team</p>
                        <Input
                          type="number"
                          id="totalSessions"
                          name="totalSessions"
                          value={formData.totalSessions}
                          onChange={handleInputChange}
                          min="0"
                          className="mt-1"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Box 2: Induction Sessions */}
                    <div className="bg-cyan-50 p-4 rounded-lg border-2 border-cyan-200">
                      <h3 className="font-semibold text-gray-800 text-lg mb-3 flex items-center gap-2">
                        🎓 Induction Sessions
                      </h3>
                      <div>
                        <Label htmlFor="inductionSessions">Total Induction Sessions</Label>
                        <p className="text-xs text-gray-500 mb-1">New team members onboarding</p>
                        <Input
                          type="number"
                          id="inductionSessions"
                          name="inductionSessions"
                          value={formData.inductionSessions}
                          onChange={handleInputChange}
                          min="0"
                          className="mt-1"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Box 3: Follow-up Sessions */}
                    <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
                      <h3 className="font-semibold text-gray-800 text-lg mb-3 flex items-center gap-2">
                        ↩️ Follow-up Sessions
                      </h3>
                      <div>
                        <Label htmlFor="followUpSessions">Total Follow-up Sessions</Label>
                        <p className="text-xs text-gray-500 mb-1">Previous inquiry follow-ups</p>
                        <Input
                          type="number"
                          id="followUpSessions"
                          name="followUpSessions"
                          value={formData.followUpSessions}
                          onChange={handleInputChange}
                          min="0"
                          className="mt-1"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Box 4: Cancelled or Rescheduled */}
                    <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                      <h3 className="font-semibold text-gray-800 text-lg mb-3 flex items-center gap-2">
                        ❌ Cancelled or Rescheduled
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="cancelledRescheduled">Count</Label>
                          <Input
                            type="number"
                            id="cancelledRescheduled"
                            name="cancelledRescheduled"
                            value={formData.cancelledRescheduled}
                            onChange={handleInputChange}
                            min="0"
                            className="mt-1"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cancelReason">Reason</Label>
                          <Textarea
                            id="cancelReason"
                            name="cancelReason"
                            value={formData.cancelReason}
                            onChange={handleTextChange}
                            placeholder="Reasons for cancellations/rescheduling..."
                            className="mt-1 min-h-16"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Box 5: Closed Deals (Auto-synced from Booked) */}
                    <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                      <h3 className="font-semibold text-gray-800 text-lg mb-3 flex items-center gap-2">
                        ✅ Closed Deals (Booked)
                      </h3>
                      <div>
                        <Label htmlFor="closedDeals">Closed Deals</Label>
                        <p className="text-xs text-green-600 mb-1 font-semibold">Auto-synced from Booked inquiries</p>
                        <Input
                          type="number"
                          id="closedDeals"
                          name="closedDeals"
                          value={formData.closedDeals}
                          onChange={handleInputChange}
                          min="0"
                          className="mt-1 bg-white font-semibold text-lg"
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-600 mt-1">Current booked inquiries: {inquiryStats.booked}</p>
                        <Button onClick={() => { setFormData(prev => ({ ...prev, closedDeals: inquiryStats.booked })); toast({ title: 'Synced', description: `Closed deals updated to ${inquiryStats.booked}` }); }} type="button" size="sm" className="mt-2 gap-1 bg-green-600 hover:bg-green-700">
                          <RefreshCw size={14} /> Sync from Booked
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Inquiry Status Changes Section - STATUS CHANGED TODAY */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-2 border-purple-300">
                    <h3 className="font-semibold text-gray-800 text-lg mb-3 flex items-center gap-2">
                      📊 Status Changes - Today
                    </h3>
                    
                    {statusChangedInquiries.length > 0 ? (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {statusChangedInquiries.map((inq: any) => {
                          const statusColors: Record<string, string> = {
                            booked: 'bg-green-100 text-green-800',
                            negative: 'bg-red-100 text-red-800',
                            in_progress: 'bg-blue-100 text-blue-800',
                          };
                          return (
                            <div key={inq.id} className="bg-white p-3 rounded border-l-4 border-purple-500 shadow-sm">
                              <div className="flex justify-between items-start mb-2">
                                <p className="font-bold text-gray-900">{inq.name}</p>
                                <div className="flex gap-2 items-center">
                                  <Badge className="bg-gray-100 text-gray-800 text-xs">{inq.previousStatus}</Badge>
                                  <span className="text-gray-400">→</span>
                                  <Badge className={`text-xs ${statusColors[inq.currentStatus] || 'bg-gray-100 text-gray-800'}`}>{inq.currentStatus}</Badge>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div><p className="text-gray-500 font-semibold">CONTACT</p><p className="text-gray-700">{inq.contact}</p></div>
                                <div><p className="text-gray-500 font-semibold">SOURCE</p><p className="text-gray-700">{inq.inquirySource}</p></div>
                                <div><p className="text-gray-500 font-semibold">INQUIRY DATE</p><p className="text-gray-700">{format(new Date(inq.inquiryTime), 'MMM dd, HH:mm')}</p></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 bg-white p-3 rounded">No inquiry status changes today</p>
                    )}
                  </div>

                  {/* CRM Inquiries Display Section */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-300">
                    <h3 className="font-semibold text-gray-800 text-lg mb-3 flex items-center gap-2">
                      📋 Today's CRM Inquiries (Complete Details)
                    </h3>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-xs text-gray-500 font-semibold">TOTAL</p>
                        <p className="text-2xl font-bold text-green-600">{todayInquiries.length}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-xs text-gray-500 font-semibold">BOOKED</p>
                        <p className="text-2xl font-bold text-yellow-600">{inquiryStats.booked}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-xs text-gray-500 font-semibold">IN PROGRESS</p>
                        <p className="text-2xl font-bold text-blue-600">{inquiryStats.in_progress}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-xs text-gray-500 font-semibold">NEGATIVE</p>
                        <p className="text-2xl font-bold text-red-600">{inquiryStats.negative}</p>
                      </div>
                    </div>
                    {todayInquiries.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {todayInquiries.map((inq: any) => (
                          <div key={inq.id} className="bg-white p-4 rounded border-l-4 border-green-500 shadow-sm hover:shadow-md transition">
                            <div className="grid grid-cols-1 gap-3">
                              {/* Header: Name and Status */}
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-bold text-gray-900 text-base">{inq.name}</p>
                                </div>
                                <Badge className={statusColors[inq.status as keyof typeof statusColors] || 'bg-gray-100'}>{inq.status}</Badge>
                              </div>

                              {/* Contact & Time Info */}
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-xs text-gray-500 font-semibold">CONTACT</p>
                                  <p className="text-gray-700">{inq.contact || 'No contact info'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-semibold">INQUIRY TIME</p>
                                  <p className="text-gray-700">{format(new Date(inq.inquiryTime), 'HH:mm:ss')}</p>
                                </div>
                              </div>

                              {/* Inquiry Details */}
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-xs text-gray-500 font-semibold">SOURCE</p>
                                  <Badge className="bg-blue-100 text-blue-800">{inq.inquirySource || 'N/A'}</Badge>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-semibold">TYPE</p>
                                  <Badge className="bg-purple-100 text-purple-800">{inq.inquiryType || 'N/A'}</Badge>
                                </div>
                              </div>

                              {/* Attendant & Response */}
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-xs text-gray-500 font-semibold">ATTENDANT</p>
                                  <p className="text-gray-700">{inq.attendant || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-semibold">RESPONSE TIME</p>
                                  <p className="text-gray-700">{inq.responseTime ? format(new Date(inq.responseTime), 'HH:mm:ss') : 'Pending'}</p>
                                </div>
                              </div>

                              {/* Call Duration & Follow-up */}
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-xs text-gray-500 font-semibold">CALL DURATION</p>
                                  <p className="text-gray-700 font-mono">{inq.callDuration || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-semibold">FOLLOW-UP DATE</p>
                                  <p className="text-gray-700">{inq.followUpDate ? format(new Date(inq.followUpDate), 'MMM dd, yyyy') : 'Not set'}</p>
                                </div>
                              </div>

                              {/* Notes */}
                              {inq.notes && (
                                <div>
                                  <p className="text-xs text-gray-500 font-semibold">NOTES</p>
                                  <p className="text-gray-700 text-sm bg-gray-50 p-2 rounded">{inq.notes}</p>
                                </div>
                              )}

                              {/* Meta Info */}
                              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                <span className="text-xs text-gray-500">ID: #{inq.id}</span>
                                <span className="text-xs text-gray-500">Added: {format(new Date(inq.createdAt), 'MMM dd, HH:mm')}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white p-6 rounded border-2 border-dashed border-green-300 text-center">
                        <p className="text-gray-600">No new inquiries today</p>
                      </div>
                    )}
                  </div>

                  {/* Session Notes */}
                  {formData.totalSessions > 0 && (
                    <div className="bg-blue-50 p-3 rounded-lg border-2 border-blue-200 -mt-2">
                      <Label htmlFor="sessionNotes" className="text-sm font-semibold">📝 Session Notes</Label>
                      <Textarea id="sessionNotes" name="sessionNotes" value={formData.sessionNotes} onChange={handleTextChange} placeholder="Add notes about sessions..." className="mt-2 min-h-12 text-sm" />
                    </div>
                  )}

                  {/* Communication Metrics */}
                  <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                    <h3 className="font-semibold text-gray-800 text-lg mb-4">💬 Communication Metrics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="callsPlaced">Calls Placed</Label>
                        <Input
                          type="number"
                          id="callsPlaced"
                          name="callsPlaced"
                          value={formData.callsPlaced}
                          onChange={handleInputChange}
                          min="0"
                          className="mt-1"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="callsReceived">Calls Received</Label>
                        <Input
                          type="number"
                          id="callsReceived"
                          name="callsReceived"
                          value={formData.callsReceived}
                          onChange={handleInputChange}
                          min="0"
                          className="mt-1"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emailsSent">Emails Sent</Label>
                        <Input
                          type="number"
                          id="emailsSent"
                          name="emailsSent"
                          value={formData.emailsSent}
                          onChange={handleInputChange}
                          min="0"
                          className="mt-1"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="whatsappMessages">WhatsApp Messages</Label>
                        <Input
                          type="number"
                          id="whatsappMessages"
                          name="whatsappMessages"
                          value={formData.whatsappMessages}
                          onChange={handleInputChange}
                          min="0"
                          className="mt-1"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="preCounseling">Pre Counseling</Label>
                        <Input
                          type="number"
                          id="preCounseling"
                          name="preCounseling"
                          value={formData.preCounseling}
                          onChange={handleInputChange}
                          min="0"
                          className="mt-1"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pre Counseling Notes */}
                  <div className="bg-green-50 p-3 rounded-lg border-2 border-green-200 -mt-2">
                    <Label htmlFor="preCounselingNotes" className="text-sm font-semibold">📝 Pre Counseling Notes</Label>
                    <Textarea id="preCounselingNotes" name="preCounselingNotes" value={formData.preCounselingNotes} onChange={handleTextChange} placeholder="Add notes about pre counseling..." className="mt-2 min-h-12 text-sm" />
                  </div>

                  {/* Communication Notes */}
                  <div className="bg-green-50 p-3 rounded-lg border-2 border-green-200 -mt-2">
                    <Label htmlFor="communicationNotes" className="text-sm font-semibold">📝 Communication Notes</Label>
                    <Textarea id="communicationNotes" name="communicationNotes" value={formData.communicationNotes} onChange={handleTextChange} placeholder="Add notes about communication..." className="mt-2 min-h-12 text-sm" />
                  </div>

                  {/* Time Metrics */}
                  <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                    <h3 className="font-semibold text-gray-800 text-lg mb-4">⏱️ Time Metrics (minutes)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="totalCallDuration">Total Call Duration</Label>
                        <Input
                          type="number"
                          id="totalCallDuration"
                          name="totalCallDuration"
                          value={formData.totalCallDuration}
                          onChange={handleInputChange}
                          min="0"
                          className="mt-1"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="averageCallDuration">Average Call Duration</Label>
                        <Input
                          type="number"
                          id="averageCallDuration"
                          name="averageCallDuration"
                          value={formData.averageCallDuration}
                          onChange={handleInputChange}
                          min="0"
                          className="mt-1"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Time Metrics Notes */}
                  <div className="bg-purple-50 p-3 rounded-lg border-2 border-purple-200 -mt-2">
                    <Label htmlFor="timeMetricsNotes" className="text-sm font-semibold">📝 Time Metrics Notes</Label>
                    <Textarea id="timeMetricsNotes" name="timeMetricsNotes" value={formData.timeMetricsNotes} onChange={handleTextChange} placeholder="Add notes about call durations..." className="mt-2 min-h-12 text-sm" />
                  </div>

                  {/* Critical Clients Section */}
                  <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                    <h3 className="font-semibold text-gray-800 text-lg mb-4 flex items-center gap-2">
                      <AlertTriangle size={20} className="text-red-600" /> Critical Clients
                    </h3>
                    <div className="space-y-3 mb-4">
                      <div>
                        <Label htmlFor="critClientName">Client Name</Label>
                        <Input
                          type="text"
                          id="critClientName"
                          value={newCriticalClient.name}
                          onChange={(e) => setNewCriticalClient({ ...newCriticalClient, name: e.target.value })}
                          placeholder="Client name"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="critClientContact">Contact</Label>
                        <Input
                          type="text"
                          id="critClientContact"
                          value={newCriticalClient.contact}
                          onChange={(e) => setNewCriticalClient({ ...newCriticalClient, contact: e.target.value })}
                          placeholder="Phone or email"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="critClientStatus">Status</Label>
                        <select
                          id="critClientStatus"
                          value={newCriticalClient.status}
                          onChange={(e) => setNewCriticalClient({ ...newCriticalClient, status: e.target.value })}
                          className="mt-1 w-full px-3 py-2 border rounded"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="critClientNotes">Notes</Label>
                        <Textarea
                          id="critClientNotes"
                          value={newCriticalClient.notes}
                          onChange={(e) => setNewCriticalClient({ ...newCriticalClient, notes: e.target.value })}
                          placeholder="Additional notes..."
                          className="mt-1 min-h-16"
                        />
                      </div>
                      <Button onClick={addCriticalClient} type="button" size="sm" variant="outline" className="gap-2">
                        <Plus size={16} /> Add Critical Client
                      </Button>
                    </div>
                    {formData.criticalClients.length > 0 && (
                      <div className="space-y-2">
                        {formData.criticalClients.map((client, index) => (
                          <div key={index} className="bg-white p-3 rounded border-l-4 border-red-500">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold">{client.name}</p>
                                <p className="text-sm text-gray-600">{client.contact}</p>
                                <Badge className="mt-1">{client.status}</Badge>
                                {client.notes && <p className="text-sm text-gray-500 mt-1">{client.notes}</p>}
                              </div>
                              <Button
                                onClick={() => removeCriticalClient(index)}
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Critical Clients Notes */}
                  {formData.criticalClients.length > 0 && (
                    <div className="bg-red-50 p-3 rounded-lg border-2 border-red-200 -mt-2">
                      <Label htmlFor="criticalClientsNotes" className="text-sm font-semibold">📝 Critical Clients Notes</Label>
                      <Textarea id="criticalClientsNotes" name="criticalClientsNotes" value={formData.criticalClientsNotes} onChange={handleTextChange} placeholder="Add notes about critical clients..." className="mt-2 min-h-12 text-sm" />
                    </div>
                  )}

                  {/* CEO Clients & Followup Section */}
                  <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                    <h3 className="font-semibold text-gray-800 text-lg mb-4 flex items-center gap-2">
                      👔 CEO's Clients & Followup
                    </h3>
                    <div className="space-y-3 mb-4">
                      <div>
                        <Label htmlFor="ceoClientName">Client Name</Label>
                        <Input
                          type="text"
                          id="ceoClientName"
                          value={newCeoClient.name}
                          onChange={(e) => setNewCeoClient({ ...newCeoClient, name: e.target.value })}
                          placeholder="Client name"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ceoClientContact">Contact</Label>
                        <Input
                          type="text"
                          id="ceoClientContact"
                          value={newCeoClient.contact}
                          onChange={(e) => setNewCeoClient({ ...newCeoClient, contact: e.target.value })}
                          placeholder="Phone or email"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ceoClientFollowup">Followup Date</Label>
                        <Input
                          type="date"
                          id="ceoClientFollowup"
                          value={newCeoClient.followupDate}
                          onChange={(e) => setNewCeoClient({ ...newCeoClient, followupDate: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ceoClientStatus">Status</Label>
                        <select
                          id="ceoClientStatus"
                          value={newCeoClient.status}
                          onChange={(e) => setNewCeoClient({ ...newCeoClient, status: e.target.value })}
                          className="mt-1 w-full px-3 py-2 border rounded"
                        >
                          <option value="pending">Pending</option>
                          <option value="contacted">Contacted</option>
                          <option value="followup_scheduled">Followup Scheduled</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="ceoClientNotes">Notes</Label>
                        <Textarea
                          id="ceoClientNotes"
                          value={newCeoClient.notes}
                          onChange={(e) => setNewCeoClient({ ...newCeoClient, notes: e.target.value })}
                          placeholder="Additional notes..."
                          className="mt-1 min-h-16"
                        />
                      </div>
                      <Button onClick={addCeoClient} type="button" size="sm" variant="outline" className="gap-2">
                        <Plus size={16} /> Add CEO Client
                      </Button>
                    </div>
                    {formData.ceoClients.length > 0 && (
                      <div className="space-y-2">
                        {formData.ceoClients.map((client, index) => (
                          <div key={index} className="bg-white p-3 rounded border-l-4 border-purple-500">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold">{client.name}</p>
                                <p className="text-sm text-gray-600">{client.contact}</p>
                                <p className="text-sm text-gray-600">Followup: {format(new Date(client.followupDate), 'MMM dd, yyyy')}</p>
                                <Badge className="mt-1">{client.status}</Badge>
                                {client.notes && <p className="text-sm text-gray-500 mt-1">{client.notes}</p>}
                              </div>
                              <Button
                                onClick={() => removeCeoClient(index)}
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="text-purple-600 hover:bg-purple-50"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CEO Clients Notes */}
                  {formData.ceoClients.length > 0 && (
                    <div className="bg-purple-50 p-3 rounded-lg border-2 border-purple-200 -mt-2">
                      <Label htmlFor="ceoClientsNotes" className="text-sm font-semibold">📝 CEO Clients Notes</Label>
                      <Textarea id="ceoClientsNotes" name="ceoClientsNotes" value={formData.ceoClientsNotes} onChange={handleTextChange} placeholder="Add notes about CEO clients..." className="mt-2 min-h-12 text-sm" />
                    </div>
                  )}

                  {/* CEO Availability Section */}
                  <div className="bg-indigo-50 p-4 rounded-lg border-2 border-indigo-200">
                    <h3 className="font-semibold text-gray-800 text-lg mb-4 flex items-center gap-2">
                      ⏰ CEO Availability for Sessions
                    </h3>
                    <div className="space-y-4">
                      {/* Status Section */}
                      <div>
                        <Label htmlFor="ceoStatus">Availability Status</Label>
                        <select
                          id="ceoStatus"
                          value={ceoAvailStatus}
                          onChange={(e) => setCeoAvailStatus(e.target.value)}
                          className="mt-1 w-full px-3 py-2 border rounded"
                        >
                          <option value="">Select status</option>
                          <option value="available">Available</option>
                          <option value="busy">Busy</option>
                          <option value="in_meeting">In Meeting</option>
                          <option value="unavailable">Unavailable</option>
                        </select>
                      </div>

                      {/* Weekly Schedule */}
                      <div className="bg-white p-3 rounded border border-indigo-300">
                        <p className="font-semibold text-gray-800 mb-3">📅 Weekly Session Schedule</p>
                        <div className="space-y-3">
                          {/* Day & Time Selection */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label htmlFor="daySelect" className="text-xs">Day</Label>
                              <select
                                id="daySelect"
                                value={selectedDay}
                                onChange={(e) => setSelectedDay(e.target.value)}
                                className="mt-1 w-full px-2 py-2 text-sm border rounded"
                              >
                                <option value="Monday">Monday</option>
                                <option value="Tuesday">Tuesday</option>
                                <option value="Wednesday">Wednesday</option>
                                <option value="Thursday">Thursday</option>
                                <option value="Friday">Friday</option>
                                <option value="Saturday">Saturday</option>
                                <option value="Sunday">Sunday</option>
                              </select>
                            </div>
                            <div>
                              <Label htmlFor="startTime" className="text-xs">Start Time</Label>
                              <Input
                                type="time"
                                id="startTime"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="mt-1 text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor="endTime" className="text-xs">End Time</Label>
                              <Input
                                type="time"
                                id="endTime"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="mt-1 text-sm"
                              />
                            </div>
                          </div>
                          <Button onClick={addTimeSlot} type="button" size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                            <Plus size={16} /> Add Time Slot
                          </Button>
                        </div>

                        {/* Display Schedule */}
                        <div className="mt-4 space-y-2">
                          {Object.entries(ceoSchedule).map(([day, slots]) => (
                            (slots.length > 0) && (
                              <div key={day} className="bg-gray-50 p-2 rounded">
                                <p className="font-semibold text-sm text-gray-700 mb-1">{day}</p>
                                <div className="space-y-1">
                                  {slots.map((slot, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white p-2 rounded text-sm">
                                      <span className="text-indigo-600 font-mono">{slot.startTime} - {slot.endTime}</span>
                                      <Button
                                        onClick={() => removeTimeSlot(day, idx)}
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="text-red-600 hover:bg-red-50 h-6 w-6 p-0"
                                      >
                                        <Trash2 size={14} />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <Label htmlFor="ceoNotes">CEO Notes</Label>
                        <Textarea
                          id="ceoNotes"
                          value={ceoAvailNotes}
                          onChange={(e) => setCeoAvailNotes(e.target.value)}
                          placeholder="Any important availability notes..."
                          className="mt-1 min-h-16"
                        />
                      </div>

                      <Button onClick={updateCeoAvailability} type="button" className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
                        <Save size={16} /> Save CEO Availability
                      </Button>
                    </div>
                  </div>

                  {/* Google Reviews Section */}
                  <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
                    <h3 className="font-semibold text-gray-800 text-lg mb-4 flex items-center gap-2">
                      ⭐ Google Reviews
                    </h3>
                    <div className="space-y-3 mb-4">
                      <div>
                        <Label htmlFor="googleRating">Rating (1-5)</Label>
                        <Input type="number" id="googleRating" min="1" max="5" value={newGoogleReview.rating} onChange={(e) => setNewGoogleReview({ ...newGoogleReview, rating: parseInt(e.target.value) || 5 })} className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="googleReviewer">Reviewer Name</Label>
                        <Input type="text" id="googleReviewer" value={newGoogleReview.reviewer} onChange={(e) => setNewGoogleReview({ ...newGoogleReview, reviewer: e.target.value })} placeholder="Reviewer name" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="googleReviewDate">Review Date</Label>
                        <Input type="date" id="googleReviewDate" value={newGoogleReview.date} onChange={(e) => setNewGoogleReview({ ...newGoogleReview, date: e.target.value })} className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="googleReviewText">Review Text</Label>
                        <Textarea id="googleReviewText" value={newGoogleReview.reviewText} onChange={(e) => setNewGoogleReview({ ...newGoogleReview, reviewText: e.target.value })} placeholder="Review content..." className="mt-1 min-h-16" />
                      </div>
                      <div>
                        <Label htmlFor="googleReviewNotes">Internal Notes</Label>
                        <Textarea id="googleReviewNotes" value={newGoogleReview.notes} onChange={(e) => setNewGoogleReview({ ...newGoogleReview, notes: e.target.value })} placeholder="Internal response notes..." className="mt-1 min-h-12" />
                      </div>
                      <Button onClick={() => { setFormData(prev => ({ ...prev, googleReviews: [...prev.googleReviews, newGoogleReview] })); setNewGoogleReview({ rating: 5, reviewText: '', reviewer: '', date: new Date().toISOString().split('T')[0], notes: '' }); }} type="button" size="sm" variant="outline" className="gap-2">
                        <Plus size={16} /> Add Google Review
                      </Button>
                    </div>
                    {formData.googleReviews.length > 0 && (
                      <div className="space-y-2">
                        {formData.googleReviews.map((review: any, index: number) => (
                          <div key={index} className="bg-white p-3 rounded border-l-4 border-yellow-500">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold">{review.reviewer}</span>
                                  <Badge className="bg-yellow-100 text-yellow-800">{'⭐'.repeat(review.rating)}</Badge>
                                </div>
                                <p className="text-sm text-gray-700">{review.reviewText}</p>
                                {review.notes && <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-1 rounded">Response: {review.notes}</p>}
                                <p className="text-xs text-gray-500 mt-1">{review.date}</p>
                              </div>
                              <Button onClick={() => setFormData(prev => ({ ...prev, googleReviews: prev.googleReviews.filter((_, i) => i !== index) }))} type="button" size="sm" variant="ghost" className="text-yellow-600 hover:bg-yellow-50">
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Google Reviews Notes */}
                  {formData.googleReviews.length > 0 && (
                    <div className="bg-yellow-50 p-3 rounded-lg border-2 border-yellow-300 -mt-2">
                      <Label htmlFor="googleReviewsNotes" className="text-sm font-semibold">📝 Google Reviews Summary Notes</Label>
                      <Textarea id="googleReviewsNotes" name="googleReviewsNotes" value={formData.googleReviewsNotes} onChange={handleTextChange} placeholder="Add general notes about reviews..." className="mt-2 min-h-12 text-sm" />
                    </div>
                  )}

                  {/* Summary & Notes */}
                  <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
                    <h3 className="font-semibold text-gray-800 text-lg mb-4">📝 Summary & Notes</h3>
                    <div>
                      <Label htmlFor="summary">Daily Summary</Label>
                      <Textarea
                        id="summary"
                        name="summary"
                        value={formData.summary}
                        onChange={handleTextChange}
                        placeholder="Brief summary of the day's CRM activities..."
                        className="mt-1 min-h-20"
                      />
                    </div>

                    <div className="mt-4">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleTextChange}
                        placeholder="Any additional notes, challenges, or observations..."
                        className="mt-1 min-h-20"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    <Save className="mr-2" size={18} />
                    {todayRecord ? 'Update Daily Log' : 'Save Daily Log'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Today's Inquiries & Stats */}
          <div className="space-y-4">
            {/* Quick Stats */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardTitle>✨ Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Booked Rate</p>
                  <p className="text-2xl font-bold text-blue-600">{bookedRate}%</p>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Total Communications</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formData.callsPlaced + formData.callsReceived + formData.emailsSent + formData.whatsappMessages}
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Total Call Time</p>
                  <p className="text-2xl font-bold text-purple-600">{formData.totalCallDuration} min</p>
                </div>
                <div className="bg-orange-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Avg Call Duration</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formData.callsPlaced > 0 ? (formData.totalCallDuration / formData.callsPlaced).toFixed(1) : 0} min
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Today's Inquiries Table */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  📋 Today's Inquiries ({todayInquiries.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {todayInquiries.length > 0 ? (
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-gray-50">
                        <TableRow>
                          <TableHead className="text-xs">Name</TableHead>
                          <TableHead className="text-xs">Source</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs">Added By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {todayInquiries.map((inq: any) => (
                          <TableRow key={inq.id} className="hover:bg-gray-50">
                            <TableCell className="text-xs">
                              <div>
                                <p className="font-semibold text-gray-800">{inq.name}</p>
                                <p className="text-gray-500">{inq.contact}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <Badge variant="outline">{inq.inquirySource}</Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              <Badge className={statusColors[inq.status as keyof typeof statusColors]}>
                                {inq.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              <p className="text-cyan-600 font-semibold">{inq.creator?.username || 'Unknown'}</p>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <p className="text-sm">No inquiries for {format(new Date(date), 'MMMM dd, yyyy')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Today's Chart */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
                <CardTitle>📊 Daily Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#4F46E5" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
