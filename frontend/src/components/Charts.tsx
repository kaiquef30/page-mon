import {
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, Activity, PieChart as PieChartIcon } from 'lucide-react';

interface ChangesOverTimeData {
  date: string;
  changes: number;
}

interface StatusDistributionData {
  name: string;
  value: number;
  color: string;
}

interface ChangesOverTimeChartProps {
  data: ChangesOverTimeData[];
}

export function ChangesOverTimeChart({ data }: ChangesOverTimeChartProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            Changes Over Time
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorChanges" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="changes"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorChanges)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface StatusDistributionChartProps {
  data: StatusDistributionData[];
}

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            Status Distribution
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px',
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface ActivityHeatmapData {
  hour: number;
  day: string;
  count: number;
}

interface ActivityHeatmapChartProps {
  data: ActivityHeatmapData[];
}

export function ActivityHeatmapChart({ data }: ActivityHeatmapChartProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-info" />
            Activity Patterns
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground text-center py-8">
          Activity heatmap coming soon
        </div>
      </CardContent>
    </Card>
  );
}

interface MiniSparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function MiniSparkline({ data, color = '#10b981', height = 30 }: MiniSparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
