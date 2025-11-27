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
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            <p className={`text-sm font-medium mt-2 flex items-center ${getChangeColor()}`}>
              {getChangeIcon()}
              {change}
            </p>
          </div>
          <div className={`stats-card-icon ${color}`}>
            <Icon size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
