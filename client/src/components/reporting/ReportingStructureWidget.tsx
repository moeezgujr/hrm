import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  UserCircle, 
  ArrowRight, 
  Users, 
  ChevronRight,
  Network,
  TrendingUp
} from 'lucide-react';
import { useLocation } from 'wouter';

type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  position: string | null;
  department?: string | null;
};

type MyPosition = {
  manager?: Employee | null;
  directReports?: Employee[];
};

interface ReportingStructureWidgetProps {
  myPosition: MyPosition | undefined;
  isLoading: boolean;
}

export default function ReportingStructureWidget({ myPosition, isLoading }: ReportingStructureWidgetProps) {
  const [, setLocation] = useLocation();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      'bg-gradient-to-br from-blue-500 to-blue-600',
      'bg-gradient-to-br from-purple-500 to-purple-600',
      'bg-gradient-to-br from-green-500 to-green-600',
      'bg-gradient-to-br from-orange-500 to-orange-600',
      'bg-gradient-to-br from-pink-500 to-pink-600',
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="border-b border-gray-100 bg-white/50 backdrop-blur">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              Reporting Structure
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="h-20 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasReportingStructure = myPosition?.manager || (myPosition?.directReports && myPosition.directReports.length > 0);

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-all duration-300">
      <CardHeader className="border-b border-gray-100 bg-white/50 backdrop-blur">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            Reporting Structure
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-primary/80 hover:bg-primary/10 transition-all"
            onClick={() => setLocation('/organization')}
            data-testid="button-view-org-structure"
          >
            <span className="mr-1">View Full Chart</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {!hasReportingStructure ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 font-medium">No reporting structure defined</p>
            <p className="text-xs text-gray-500 mt-1">Your organizational hierarchy will appear here</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Manager Section */}
            {myPosition?.manager && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-xs font-semibold bg-blue-50 text-blue-700 border-blue-200">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Reports To
                  </Badge>
                </div>
                <div 
                  className="group relative overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-blue-50/50 p-4 hover:shadow-md transition-all duration-300 cursor-pointer"
                  onClick={() => setLocation('/organization')}
                  data-testid="card-manager"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center gap-4">
                    <Avatar className={`h-12 w-12 ${getAvatarColor(0)} shadow-lg ring-2 ring-white`}>
                      <AvatarFallback className="text-white font-bold">
                        {getInitials(myPosition.manager.firstName, myPosition.manager.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {myPosition.manager.firstName} {myPosition.manager.lastName}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{myPosition.manager.position || 'Manager'}</p>
                      {myPosition.manager.department && (
                        <p className="text-xs text-gray-500 truncate">{myPosition.manager.department}</p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            )}

            {/* Direct Reports Section */}
            {myPosition?.directReports && myPosition.directReports.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-xs font-semibold bg-green-50 text-green-700 border-green-200">
                    <Users className="h-3 w-3 mr-1" />
                    Direct Reports ({myPosition.directReports.length})
                  </Badge>
                </div>
                <div className="space-y-2">
                  {myPosition.directReports.slice(0, 3).map((report, index) => (
                    <div 
                      key={report.id}
                      className="group relative overflow-hidden rounded-xl border border-green-100 bg-gradient-to-r from-green-50 to-green-50/50 p-4 hover:shadow-md transition-all duration-300 cursor-pointer"
                      onClick={() => setLocation('/organization')}
                      data-testid={`card-report-${report.id}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex items-center gap-4">
                        <Avatar className={`h-12 w-12 ${getAvatarColor(index + 1)} shadow-lg ring-2 ring-white`}>
                          <AvatarFallback className="text-white font-bold">
                            {getInitials(report.firstName, report.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {report.firstName} {report.lastName}
                          </p>
                          <p className="text-sm text-gray-600 truncate">{report.position || 'Employee'}</p>
                          {report.department && (
                            <p className="text-xs text-gray-500 truncate">{report.department}</p>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-green-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                  
                  {myPosition.directReports.length > 3 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 transition-all"
                      onClick={() => setLocation('/organization')}
                      data-testid="button-view-all-reports"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      View all {myPosition.directReports.length} reports
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
