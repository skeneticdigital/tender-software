import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  variant?: 'default' | 'alert' | 'success' | 'warning' | 'navy';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  onClick
}) => {
  const variantStyles = {
    default: 'bg-white border-slate-200 text-slate-800',
    alert: 'bg-rose-50/70 border-rose-200 text-rose-900',
    success: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
    warning: 'bg-amber-50/70 border-amber-200 text-amber-900',
    navy: 'bg-slate-900 border-slate-800 text-white'
  };

  const iconBgStyles = {
    default: 'bg-slate-100 text-slate-700',
    alert: 'bg-rose-100 text-rose-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    navy: 'bg-slate-800 text-blue-400'
  };

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-xl border transition-all duration-200 shadow-xs hover:shadow-md ${variantStyles[variant]} ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider opacity-75">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg ${iconBgStyles[variant]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {(subtitle || trend) && (
          <div className="mt-1.5 flex items-center gap-2 text-xs opacity-80">
            {trend && (
              <span className={`font-semibold ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trend.value}
              </span>
            )}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
