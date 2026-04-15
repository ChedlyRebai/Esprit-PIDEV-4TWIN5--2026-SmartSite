import React from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, AlertCircle } from 'lucide-react';

export interface BudgetInfluencePoint {
  step: number;
  label: string;
  title: string;
  approvedAt: string | null;
  incrementalSavingsTnd: number;
  cumulativePotentialReliefTnd: number;
  budgetSpentSnapshotTnd: number | null;
  siteBudgetTotalTnd: number | null;
}

interface Props {
  data: BudgetInfluencePoint[];
}

const fmt = (n: number) =>
  Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—';

export const BudgetInfluenceApprovalChart: React.FC<Props> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-50/50">
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-1" />
            <div>
              <CardTitle className="flex items-center gap-2">💰 Courbe d'Impact Budgétaire</CardTitle>
              <CardDescription className="mt-2">
                📊 Visualisez les économies cumulatives estimées et le budget dépensé à chaque approbation.<br/>
                ⏳ Approuvez au moins une recommandation pour voir les données.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-amber-300 mx-auto mb-3" />
          <p className="text-sm text-amber-900 font-semibold">Aucune recommandation approuvée pour ce chantier</p>
          <p className="text-xs text-amber-800 mt-1">Les recommandations approuvées apparaîtront dans cette graphique</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((row) => ({
    ...row,
    spent: row.budgetSpentSnapshotTnd ?? undefined,
    cumulative: row.cumulativePotentialReliefTnd,
  }));

  const hasMinimalData = data.length === 1;

  return (
    <Card className="border-2 border-orange-200 shadow-lg">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-orange-400/20 to-orange-500/20 rounded-lg">
            <TrendingUp className="h-5 w-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">💰 Courbe d'Impact Budgétaire</CardTitle>
            <CardDescription className="mt-2">
              📈 <strong>Ligne Orange:</strong> Économies cumulatives estimées (TND) débloquées à chaque approbation<br/>
              📊 <strong>Ligne Bleue:</strong> Budget dépensé capturé lors de chaque approbation (snapshot site)<br/>
              💡 <strong>Interprétation:</strong> Plus la ligne orange monte, plus vous accumulez des économies potentielles
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[380px] pt-0">
        <div className="bg-orange-50/40 border border-orange-200/50 p-3 rounded-lg mb-4 text-xs text-foreground/80">
          <p>
            <strong>🎯 Fonctionnement:</strong> Chaque approbation crée un snapshot du budget du chantier. 
            Les courbes montrent comment les économies s'accumulent et comment le budget évolue au fil des approbations.
          </p>
        </div>
        {hasMinimalData && (
          <div className="bg-blue-50/40 border border-blue-200/50 p-3 rounded-lg mb-4 text-xs text-foreground/80">
            <p>
              <strong>ℹ️ Note:</strong> Une seule recommandation approuvée pour le moment. 
              Approuvez d'autres recommandations pour voir l'évolution des courbes d'économies et de budget.
            </p>
          </div>
        )}
        <div
          role="img"
          aria-label="Line chart showing cumulative estimated savings and budget spent at each recommendation approval"
          className={`${hasMinimalData ? 'h-[calc(100% - 115px)]' : 'h-[calc(100% - 60px)]'}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11 }}
              label={{ value: 'TND', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              label={{ value: 'Spent (TND)', angle: 90, position: 'insideRight', style: { fontSize: 10 } }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as BudgetInfluencePoint & { spent?: number; cumulative: number };
                return (
                  <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
                    <p className="font-semibold text-popover-foreground">{p.title}</p>
                    <p className="text-muted-foreground mt-1">{p.label}</p>
                    {p.approvedAt && (
                      <p className="text-muted-foreground">{new Date(p.approvedAt).toLocaleString('en-US')}</p>
                    )}
                    <p className="mt-2">
                      Cumulative potential relief: <strong>{fmt(p.cumulativePotentialReliefTnd)} TND</strong>
                    </p>
                    {p.step > 0 && (
                      <p>
                        This approval (increment): <strong>{fmt(p.incrementalSavingsTnd)} TND</strong>
                      </p>
                    )}
                    {p.budgetSpentSnapshotTnd != null && (
                      <p>
                        Budget spent (snapshot): <strong>{fmt(p.budgetSpentSnapshotTnd)} TND</strong>
                      </p>
                    )}
                  </div>
                );
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="cumulative"
              name="Cumulative est. savings (TND)"
              stroke="#ea580c"
              strokeWidth={2}
              dot={{ r: 4, fill: '#ea580c' }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="spent"
              name="Budget spent at snapshot (TND)"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4, fill: '#2563eb' }}
              connectNulls
              activeDot={{ r: 6 }}
            />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="sr-only" aria-live="polite">
          <p>Budget impact summary by approval step:</p>
          <ul>
            {chartData.map((p) => (
              <li key={`${p.label}-${p.step}`}>
                {p.label}: cumulative estimated savings {fmt(p.cumulativePotentialReliefTnd)} TND
                {p.budgetSpentSnapshotTnd != null
                  ? `, budget spent snapshot ${fmt(p.budgetSpentSnapshotTnd)} TND.`
                  : "."}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
