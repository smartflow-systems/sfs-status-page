import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

interface ResponseTimeChartProps {
  data?: Array<{ time: string; responseTime: number }>;
  height?: number;
}

export function ResponseTimeChart({ data, height = 60 }: ResponseTimeChartProps) {
  const defaultData = data || Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    responseTime: Math.floor(Math.random() * 100 + 50),
  }));

  return (
    <ChartContainer
      config={{
        responseTime: {
          label: "Response Time",
          color: "hsl(var(--chart-1))",
        },
      }}
      className="w-full"
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={defaultData}>
          <defs>
            <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" hide />
          <YAxis hide />
          <Area
            type="monotone"
            dataKey="responseTime"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            fill="url(#colorResponse)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
