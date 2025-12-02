import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus, Clock, TriangleAlert, Check } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { useLocation } from 'wouter';

interface StatsCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: LucideIcon;
  color: string;
  onClick?: () => void;
}

export default function StatsCard({ title, value, change, changeType, icon: Icon, color, onClick }: StatsCardProps) {
  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase':
        return <ArrowUp className="mr-1" size={12} />;
      case 'decrease':
        return <TriangleAlert className="mr-1" size={12} />;
      default:
        return <Clock className="mr-1" size={12} />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-accent';
      case 'decrease':
        return 'text-destructive';
      default:
        return 'text-warning';
    }
  };

  return (
    <Card className={`stats-card ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`} onClick={onClick}>
      <CardContent className="p-3 md:p-6">
        <div className="flex items-start md:items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-gray-600 text-xs md:text-sm font-medium truncate">{title}</p>
            <p className="text-xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2">{value}</p>
            <p className={`text-xs md:text-sm font-medium mt-1 md:mt-2 flex items-center ${getChangeColor()}`}>
              {getChangeIcon()}
              <span className="truncate">{change}</span>
            </p>
          </div>
          <div className={`stats-card-icon ${color} w-8 h-8 md:w-12 md:h-12 flex-shrink-0 ml-2`}>
            <Icon size={16} className="md:hidden" />
            <Icon size={24} className="hidden md:block" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
