"use client";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

interface RiskMetrics {
    overallScore: number;
    riskLevel: string;
    totalAttacks: number;
    blocked: number;
    passed: number;
    blockRate: number;
    defendedBlockRate: number;
    undefendedBlockRate: number;
    categories: { name: string; attacks: number; blocked: number }[];
    recommendations: string[];
}

export default function ReportCharts({ metrics }: { metrics: RiskMetrics }) {
    const comparisonData = {
        labels: ["Defended", "Undefended"],
        datasets: [
            {
                label: "Block Rate %",
                data: [
                    Math.round(metrics.defendedBlockRate * 100),
                    Math.round(metrics.undefendedBlockRate * 100),
                ],
                backgroundColor: [
                    "rgba(16, 185, 129, 0.7)",
                    "rgba(239, 68, 68, 0.7)",
                ],
                borderColor: [
                    "rgba(16, 185, 129, 1)",
                    "rgba(239, 68, 68, 1)",
                ],
                borderWidth: 1,
                borderRadius: 8,
            },
        ],
    };

    const categoryData = {
        labels: metrics.categories.map((c) => c.name),
        datasets: [
            {
                data: metrics.categories.map((c) => c.attacks),
                backgroundColor: [
                    "rgba(99, 102, 241, 0.7)",
                    "rgba(245, 158, 11, 0.7)",
                    "rgba(236, 72, 153, 0.7)",
                    "rgba(16, 185, 129, 0.7)",
                ],
                borderWidth: 0,
            },
        ],
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: { display: false },
        },
        scales: {
            x: {
                ticks: { color: "rgba(255,255,255,0.5)" },
                grid: { color: "rgba(255,255,255,0.05)" },
            },
            y: {
                max: 100,
                ticks: { color: "rgba(255,255,255,0.5)", callback: (v: number | string) => `${v}%` },
                grid: { color: "rgba(255,255,255,0.05)" },
            },
        },
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: "bottom" as const,
                labels: { color: "rgba(255,255,255,0.7)", font: { size: 12 }, padding: 16 },
            },
        },
    };

    return (
        <div className="grid-2">
            <div className="chart-container">
                <h3 className="chart-title">Defense Effectiveness</h3>
                <Bar data={comparisonData} options={barOptions} />
            </div>
            <div className="chart-container">
                <h3 className="chart-title">Attacks by Category</h3>
                <div style={{ maxWidth: "280px", margin: "0 auto" }}>
                    <Doughnut data={categoryData} options={doughnutOptions} />
                </div>
            </div>
        </div>
    );
}
