"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";
import { Activity, Zap, AlertTriangle, ShieldCheck, Database, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getFeatureFlag } from "@/utils/flags";

const MOCK_LATENCY_DATA = [
  { time: "00:00", p95: 120, p50: 45 },
  { time: "04:00", p95: 90, p50: 38 },
  { time: "08:00", p95: 250, p50: 110 },
  { time: "12:00", p95: 380, p50: 145 },
  { time: "16:00", p95: 310, p50: 130 },
  { time: "20:00", p95: 210, p50: 85 },
];

const MOCK_RPS_DATA = [
  { time: "MT", rps: 34 },
  { time: "12:05", rps: 45 },
  { time: "12:10", rps: 67 },
  { time: "12:15", rps: 89 },
  { time: "12:20", rps: 52 },
  { time: "12:25", rps: 41 },
];

export default function SystemDashboard() {
  const isRateLimitEnabled = getFeatureFlag("ENABLE_RATE_LIMIT");
  const isSystemDashboardEnabled = getFeatureFlag("SHOW_SYSTEM_DASHBOARD");

  if (!isSystemDashboardEnabled) {
    return <div className="p-8 text-center text-muted-foreground">Dashboard disabled via feature flag.</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Server className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold text-primary tracking-tight">Enterprise Observability</h1>
        </div>
        <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Real-time system health and performance metrics.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-tighter">API p95 Latency</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">142ms</div>
            <p className="text-[10px] text-muted-foreground font-bold mt-1">+12% from last hour</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-tighter">Current RPS</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black">52.4</div>
            <p className="text-[10px] text-muted-foreground font-bold mt-1">Peak: 89.2 req/s</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-tighter">Error rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-destructive">0.04%</div>
            <p className="text-[10px] text-muted-foreground font-bold mt-1">Stable within SLAs</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-tighter">Protection</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={isRateLimitEnabled ? "default" : "destructive"}>
                {isRateLimitEnabled ? "Active" : "Disabled"}
              </Badge>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Rate Limiting</span>
            </div>
            <p className="text-[10px] text-muted-foreground font-bold mt-2">Blocked 12 IPs today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm border-2">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase tracking-tighter">API Response Times (ms)</CardTitle>
            <CardDescription className="text-xs font-bold">p95 and p50 latency over the last 24 hours.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_LATENCY_DATA}>
                <defs>
                  <linearGradient id="colorP95" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} fontStyle="bold" />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} fontStyle="bold" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '2px solid #eee' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                />
                <Area type="monotone" dataKey="p95" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorP95)" strokeWidth={3} />
                <Area type="monotone" dataKey="p50" stroke="hsl(var(--muted-foreground))" fillOpacity={0} strokeWidth={1} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-2">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase tracking-tighter">Throughput (RPS)</CardTitle>
            <CardDescription className="text-xs font-bold">Requests per second (sampled 1m intervals).</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_RPS_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} fontStyle="bold" />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} fontStyle="bold" />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '2px solid #eee' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                />
                <Bar dataKey="rps" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-2 overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-black uppercase tracking-tighter">Database Health</CardTitle>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Optimal</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {[
              { label: "Connection Pool", val: "12 / 20", status: "Healthy" },
              { label: "Migration Status", val: "Applied (v1.4.2)", status: "Synced" },
              { label: "Storage Used", val: "42.5 MB", status: "Low" },
              { label: "Backup Status", val: "Completed (2h ago)", status: "Success" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-4 px-6 hover:bg-muted/5 transition-colors">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{item.label}</span>
                <div className="flex items-center gap-4">
                  <span className="font-black text-sm">{item.val}</span>
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-tighter">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
