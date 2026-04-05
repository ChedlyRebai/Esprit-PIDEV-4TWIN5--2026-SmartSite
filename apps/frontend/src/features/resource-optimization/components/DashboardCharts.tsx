import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingDown, Leaf, DollarSign } from 'lucide-react';

interface DashboardStatsProps {
  dashboard: {
    financial: {
      realizedSavings: string;
      roi: string;
    };
    environmental: {
      actualCO2Reduction: string;
    };
    recommendations: {
      implemented: number;
    };
  } | null;
}

export const SummaryStats: React.FC<DashboardStatsProps> = ({ dashboard }) => {
  if (!dashboard) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Économies réalisées</CardTitle>
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent className="bg-emerald-50 p-4 rounded-lg -m-4 mt-2">
            <div className="text-2xl font-bold text-emerald-600">0 TND</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reco. mises en œuvre</CardTitle>
            <Leaf className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent className="bg-green-50 p-4 rounded-lg -m-4 mt-2">
            <div className="text-2xl font-bold text-green-600">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Efficacité</CardTitle>
            <TrendingDown className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent className="bg-blue-50 p-4 rounded-lg -m-4 mt-2">
            <div className="text-2xl font-bold text-blue-600">0%</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    {
      icon: DollarSign,
      label: 'Économies réalisées',
      value: `${(dashboard.financial?.realizedSavings && isFinite(Number(dashboard.financial.realizedSavings)) ? Number(dashboard.financial.realizedSavings) : 0).toLocaleString()} TND`,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      icon: Leaf,
      label: 'Reco. mises en œuvre',
      value: `${dashboard.recommendations?.implemented || 0}`,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      icon: TrendingDown,
      label: 'Efficacité globale',
      value: `${(dashboard.financial?.roi && isFinite(Number(dashboard.financial.roi)) ? Math.round(Number(dashboard.financial.roi) * 100) : 0)}%`,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <Icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent className={`${stat.bg} p-4 rounded-lg -m-4 mt-2`}>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

interface SavingsChartProps {
  data: Array<{
    type?: string;
    name?: string;
    value?: number;
    [key: string]: any;
  }>;
}

export const SavingsChart: React.FC<SavingsChartProps> = ({ data }) => {
  // Ensure data is valid and filter out invalid values
  const validData = (data || []).map(item => ({
    ...item,
    value: isFinite(item.value) ? Number(item.value) : 0
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition des gains (chantier)</CardTitle>
        <CardDescription>
          Estimation par grand poste : budget, équipes, planning — en TND
        </CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={validData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value: any) => `${isFinite(value) ? Number(value).toLocaleString() : 0} TND`} />
            <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

interface CO2ImpactChartProps {
  current: number;
  potential: number;
  realized: number;
}

export const CO2ImpactChart: React.FC<CO2ImpactChartProps> = ({
  current,
  potential,
  realized,
}) => {
  const data = [
    { name: 'Émissions (réf.)', value: isFinite(current) ? Number(current) : 0 },
    { name: 'Réduction potentielle', value: isFinite(potential) ? Number(potential) : 0 },
    { name: 'Réduction réalisée', value: isFinite(realized) ? Number(realized) : 0 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Indicateurs environnementaux</CardTitle>
        <CardDescription>CO₂ et gains liés aux recommandations (unités du rapport chantier)</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `${value}`} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#059669"
              strokeWidth={2}
              dot={{ fill: '#059669', r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

interface RecommendationStatusChartProps {
  pending: number;
  approved: number;
  implemented: number;
}

export const RecommendationStatusChart: React.FC<
  RecommendationStatusChartProps
> = ({ pending, approved, implemented }) => {
  const data = [
    { name: 'En attente', value: pending },
    { name: 'Approuvées', value: approved },
    { name: 'Mises en place', value: implemented },
  ];

  const colors = ['#fbbf24', '#3b82f6', '#10b981'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statut des recommandations</CardTitle>
        <CardDescription>Répartition par statut</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
