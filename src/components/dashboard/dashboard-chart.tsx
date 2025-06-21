"use client"

import * as React from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

export default function DashboardChart() {
  const [data, setData] = React.useState<any[]>([]);

  React.useEffect(() => {
    // Mock data for the chart, generated on the client to avoid hydration mismatch
    const chartData = [
      { name: "Ene", total: Math.floor(Math.random() * 50) + 10 },
      { name: "Feb", total: Math.floor(Math.random() * 50) + 10 },
      { name: "Mar", total: Math.floor(Math.random() * 50) + 10 },
      { name: "Abr", total: Math.floor(Math.random() * 50) + 10 },
      { name: "May", total: Math.floor(Math.random() * 50) + 10 },
      { name: "Jun", total: Math.floor(Math.random() * 50) + 10 },
    ];
    setData(chartData);
  }, []);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px]">
        <p className="text-muted-foreground">Cargando gráfico...</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted))' }}
          contentStyle={{ 
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))'
          }}
        />
        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
