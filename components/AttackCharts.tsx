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

interface AttackResult {
    id: string;
    name: string;
    category: string;
    defended: boolean;
    blocked: boolean;
    threats: string[];
}

interface Props {
    results: AttackResult[];
    defendedResults: AttackResult[];
    undefendedResults: AttackResult[];
}

export default function AttackCharts({
    results,
    defendedResults,
    undefendedResults,
}: Props) {
    if (results.length === 0) return null;

    // --- Category breakdown ---
    const categories = [...new Set(results.map((r) => r.category))];
    const catBlocked = categories.map(
        (cat) => results.filter((r) => r.category === cat && r.blocked).length
    );
    const catPassed = categories.map(
        (cat) => results.filter((r) => r.category === cat && !r.blocked).length
    );

    const categoryData = {
        labels: categories,
        datasets: [
            {
                label: "Blocked",
                data: catBlocked,
                backgroundColor: "rgba(16, 185, 129, 0.7)",
                borderColor: "rgba(16, 185, 129, 1)",
                borderWidth: 1,
                borderRadius: 6,
            },
            {
                label: "Passed",
                data: catPassed,
                backgroundColor: "rgba(239, 68, 68, 0.7)",
                borderColor: "rgba(239, 68, 68, 1)",
                borderWidth: 1,
                borderRadius: 6,
            },
        ],
    };

    // --- Defended vs Undefended doughnut ---
    const defBlocked = defendedResults.filter((r) => r.blocked).length;
    const defPassed = defendedResults.filter((r) => !r.blocked).length;
    const undefBlocked = undefendedResults.filter((r) => r.blocked).length;
    const undefPassed = undefendedResults.filter((r) => !r.blocked).length;

    const defenseComparisonData = {
        labels: [
            "Defended — Blocked",
            "Defended — Passed",
            "Undefended — Blocked",
            "Undefended — Passed",
        ],
        datasets: [
            {
                data: [defBlocked, defPassed, undefBlocked, undefPassed],
                backgroundColor: [
                    "rgba(16, 185, 129, 0.8)",
                    "rgba(245, 158, 11, 0.8)",
                    "rgba(99, 102, 241, 0.8)",
                    "rgba(239, 68, 68, 0.8)",
                ],
                borderWidth: 0,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                labels: { color: "rgba(255,255,255,0.7)", font: { size: 12 } },
            },
        },
        scales: {
            x: {
                ticks: { color: "rgba(255,255,255,0.5)" },
                grid: { color: "rgba(255,255,255,0.05)" },
            },
            y: {
                ticks: { color: "rgba(255,255,255,0.5)", stepSize: 1 },
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
                labels: { color: "rgba(255,255,255,0.7)", font: { size: 11 }, padding: 16 },
            },
        },
    };

    return (
        <div className="grid-2">
            <div className="chart-container">
                <h3 className="chart-title">Results by Attack Category</h3>
                <Bar data={categoryData} options={chartOptions} />
            </div>
            <div className="chart-container">
                <h3 className="chart-title">Defense Comparison</h3>
                <div style={{ maxWidth: "320px", margin: "0 auto" }}>
                    <Doughnut data={defenseComparisonData} options={doughnutOptions} />
                </div>
            </div>
        </div>
    );
}
