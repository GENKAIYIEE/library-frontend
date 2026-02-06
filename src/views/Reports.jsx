import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { FileText, Users, DollarSign, Download, Calendar, FileBarChart, TrendingUp, PieChart as PieChartIcon, BarChart3, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];



export default function Reports() {


    // Date Filter State
    const [dateRange, setDateRange] = useState("30");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");

    // Report Data State
    const [mostBorrowed, setMostBorrowed] = useState([]);
    const [topStudents, setTopStudents] = useState([]);
    const [penalties, setPenalties] = useState({ monthly: [], summary: {} });
    const [demographics, setDemographics] = useState({ by_course: [], by_year: [] });
    const [statistics, setStatistics] = useState({ ranges: [], months: [], data: [], academic_year: "" }); // NEW
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("books");



    // Calculate date range
    const getDateParams = () => {
        const now = new Date();
        let start, end;

        if (dateRange === "custom") {
            return { start_date: customStart, end_date: customEnd };
        }

        end = now.toISOString().split('T')[0];

        switch (dateRange) {
            case "7":
                start = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
                break;
            case "30":
                start = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
                break;
            case "90":
                start = new Date(now.setDate(now.getDate() - 90)).toISOString().split('T')[0];
                break;
            case "365":
                start = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0];
                break;
            default:
                start = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
        }

        return { start_date: start, end_date: new Date().toISOString().split('T')[0] };
    };

    // Fetch all reports
    const fetchReports = () => {
        setLoading(true);
        const params = getDateParams();

        Promise.all([
            axiosClient.get("/reports/most-borrowed", { params }),
            axiosClient.get("/reports/top-students", { params }),
            axiosClient.get("/reports/penalties", { params }),
            axiosClient.get("/reports/demographics", { params }),
            axiosClient.get("/reports/statistics") // Let backend determine correct academic year
        ])
            .then(([booksRes, studentsRes, penaltiesRes, demoRes, statsRes]) => {
                setMostBorrowed(booksRes.data);
                setTopStudents(studentsRes.data);
                setPenalties(penaltiesRes.data);
                setDemographics(demoRes.data);
                setStatistics(statsRes.data); // NEW
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchReports();
    }, [dateRange, customStart, customEnd]);

    // Export CSV
    const exportCsv = (type) => {
        const params = getDateParams();
        const queryString = new URLSearchParams(params).toString();
        const token = localStorage.getItem("ACCESS_TOKEN");

        const link = document.createElement('a');
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
        link.href = `${baseUrl}/reports/export/${type}?${queryString}`;
        link.setAttribute('download', `report_${type}_${new Date().toISOString().split('T')[0]}.csv`);

        fetch(link.href, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `report_${type}_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
            });
    };

    // Export PDF
    const exportPdf = () => {
        window.print();
    };

    const handlePrintStatistics = () => {
        // Month number to display label mapping
        const monthLabels = {
            6: "JUNE", 7: "JULY", 8: "AUG.", 9: "SEPT.", 10: "OCT.", 11: "NOV.",
            12: "DEC.", 1: "JAN", 2: "FEB.", 3: "MAR.", 4: "APR.", 5: "MAY"
        };

        // Use the actual months from statistics (these are numeric keys from backend)
        const months = statistics.months || [6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5];

        // Generate table rows for each call number range
        const tableRows = statistics.ranges.map(range => {
            const rowTotal = months.reduce((sum, month) => {
                return sum + (statistics.data[range]?.[month] || 0);
            }, 0);

            const monthCells = months.map(month => {
                const value = statistics.data[range]?.[month] || 0;
                return `<td class="num-col">${value > 0 ? value : ''}</td>`;
            }).join('');

            return `
                <tr>
                    <td class="range-col">${range}</td>
                    ${monthCells}
                    <td class="num-col total-col">${rowTotal > 0 ? rowTotal : ''}</td>
                </tr>
            `;
        }).join('');

        // Calculate column totals
        const monthTotals = months.map(month => {
            const total = statistics.ranges.reduce((sum, range) => {
                return sum + (statistics.data[range]?.[month] || 0);
            }, 0);
            return `<td class="num-col">${total > 0 ? total : ''}</td>`;
        }).join('');

        // Grand total
        const grandTotal = statistics.ranges.reduce((total, range) => {
            return total + statistics.months.reduce((sum, month) => {
                return sum + (statistics.data[range]?.[month] || 0);
            }, 0);
        }, 0);

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Statistics of Borrowed Books - ${statistics.academic_year || 'A.Y. 2025-2026'}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    @page { size: portrait; margin: 0.3in; }
                    html, body { height: 99%; }
                    body { 
                        font-family: 'Times New Roman', serif; 
                        padding: 15px; 
                        background: white;
                        color: #000;
                        font-size: 11px;
                        display: flex;
                        flex-direction: column;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 15px;
                        padding-bottom: 8px;
                        border-bottom: 2px solid #1e3a8a;
                    }
                    .header-logo img {
                        width: 70px;
                        height: 70px;
                    }
                    .header-text { 
                        flex: 1; 
                        text-align: center; 
                        padding: 0 10px;
                    }
                    .header-text h1 { font-size: 14px; color: #1e3a8a; font-weight: bold; margin-bottom: 2px; }
                    .header-text p { font-size: 10px; color: #334155; margin-top: 1px; }
                    
                    .title {
                        text-align: center;
                        margin: 15px 0;
                    }
                    .title h2 { font-size: 14px; font-weight: bold; color: #000; margin: 0; }
                    .title p { font-size: 12px; margin-top: 2px; color: #000; }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                        font-size: 11px;
                    }
                    th, td {
                        border: 1px solid #333;
                        padding: 5px 4px;
                        text-align: center;
                    }
                    th {
                        background: #f0f0f0;
                        font-weight: bold;
                        padding: 6px 4px;
                    }
                    .range-col { 
                        width: 70px; 
                        font-weight: bold; 
                        text-align: left;
                        padding-left: 6px;
                    }
                    .num-col { width: 42px; }
                    .total-col { font-weight: bold; }
                    .month-header { font-size: 10px; }
                    .grand-total { font-weight: bold; background: #f0f0f0; }
                    
                    .signatures {
                        display: flex;
                        flex-direction: column;
                        align-items: flex-start;
                        margin-top: 50px;
                        padding-left: 30px;
                    }
                    .signature-box { 
                        text-align: left; 
                        margin-bottom: 15px;
                    }
                    .signature-box .label { font-size: 11px; margin-bottom: 20px; }
                    .signature-box .name { 
                        font-size: 11px; 
                        font-weight: bold; 
                        text-decoration: underline;
                    }
                    .signature-box .title-text { 
                        font-size: 10px; 
                        font-style: italic; 
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-logo" style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center;">
                        <img src="${window.location.origin}/pclu-logo.png" alt="PCLU" style="width: 100%; height: 100%; object-fit: contain;" />
                    </div>
                    <div class="header-text">
                        <h1>POLYTECHNIC COLLEGE OF LA UNION (PCLU), INC.</h1>
                        <p>(Formerly PAMETS COLLEGES)</p>
                        <p>Don Pastor L. Panay Sr. Street, San Nicolas Sur, Agoo, La Union 2504</p>
                        <p>Tel. No. (072) 2061761 Mobile No.09171623141/09260953781</p>
                        <p>Email: pclucollege@pclu.com.ph</p>
                        <p>https://www.facebook.com/PCLUOfficialpage</p>
                    </div>
                    <div class="iso-badge" style="min-width: 80px; border: 1px solid #999; padding: 2px; display: inline-flex; flex-direction: column; align-items: center; background: white;">
                        <div style="background: #1e3a8a; width: 100%; padding: 4px; display: flex; flex-direction: column; align-items: center;">
                            <div style="display: flex; align-items: center; justify-content: center; width: 100%; border-bottom: 1px solid #ffffff40; padding-bottom: 2px; margin-bottom: 2px;">
                                <span style="font-size: 24px; font-weight: 900; line-height: 1; color: white; font-family: Arial, sans-serif;">ISO</span>
                                <div style="display: flex; flex-direction: column; margin-left: 4px; border-left: 1px solid white; padding-left: 4px;">
                                    <span style="font-size: 10px; font-weight: bold; line-height: 1; color: #22d3ee;">9001</span>
                                    <span style="font-size: 10px; font-weight: bold; line-height: 1; color: #22d3ee;">2015</span>
                                </div>
                            </div>
                            <span style="font-size: 9px; font-weight: 900; color: white; letter-spacing: 1px; font-family: Arial, sans-serif; width: 100%; text-align: center;">CERTIFIED</span>
                        </div>
                    </div>
                </div>

                <div class="title">
                    <h2>Statistics of Borrowed Books by Faculty</h2>
                    <p>${statistics.academic_year || 'A.Y. 2025-2026'}</p>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th rowspan="2" class="range-col"></th>
                            <th colspan="12" style="text-align: center;">MONTH</th>
                            <th rowspan="2" class="num-col"></th>
                        </tr>
                        <tr>
                            ${months.map(m => `<th class="num-col month-header">${monthLabels[m]}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                        <tr class="grand-total">
                            <td class="range-col">TOTAL</td>
                            ${monthTotals}
                            <td class="num-col total-col">${grandTotal > 0 ? grandTotal : ''}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="signatures">
                    <div class="signature-box">
                        <p class="label">Prepared by:</p>
                        <p class="name">PATRICIA NIKOLE C. MASILANG</p>
                        <p class="title-text">College Library Clerk</p>
                    </div>
                    <div class="signature-box">
                        <p class="label">Noted by:</p>
                        <p class="name">LEAH E. CAMSO.RL MLIS</p>
                        <p class="title-text">Chief Librarian</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'absolute';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = 'none';
        printFrame.style.left = '-9999px';
        printFrame.srcdoc = printContent;
        document.body.appendChild(printFrame);

        printFrame.onload = () => {
            try {
                printFrame.contentWindow.focus();
                printFrame.contentWindow.print();
            } catch (e) {
                console.error('Print error:', e);
            }
            setTimeout(() => {
                if (printFrame.parentNode) {
                    document.body.removeChild(printFrame);
                }
            }, 2000);
        };
    };

    // Custom Tooltip for Charts

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-800 p-4 border border-gray-100 dark:border-slate-700 shadow-xl rounded-xl">
                    <p className="font-bold text-gray-800 dark:text-white mb-2">{label || payload[0].name}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm font-medium" style={{ color: entry.color || entry.fill }}>
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 bg-gray-50 dark:bg-slate-900 p-8 min-h-screen print:bg-white print:m-0 print:p-0 transition-colors duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl shadow-lg shadow-indigo-900/20">
                        <FileBarChart size={28} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-slate-400">
                            Analytics & Reports
                        </h2>
                        <p className="text-gray-500 dark:text-slate-400 font-medium">Deep insights into library performance</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                        <Calendar size={18} className="text-indigo-600 dark:text-indigo-400" />
                        <select
                            value={dateRange}
                            onChange={e => setDateRange(e.target.value)}
                            className="bg-transparent border-none text-sm font-semibold text-gray-700 dark:text-white focus:ring-0 cursor-pointer outline-none"
                        >
                            <option value="7">Last 7 Days</option>
                            <option value="30">Last 30 Days</option>
                            <option value="90">Last 90 Days</option>
                            <option value="365">This Year</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>

                    {dateRange === "custom" && (
                        <div className="flex items-center gap-2 px-2 animate-in fade-in slide-in-from-right-4 duration-300">
                            <input
                                type="date"
                                value={customStart}
                                onChange={e => setCustomStart(e.target.value)}
                                className="border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <span className="text-gray-400 text-xs">to</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={e => setCustomEnd(e.target.value)}
                                className="border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block mb-8 pb-4 border-b border-gray-200">
                <h1 className="text-3xl font-bold text-gray-900">Library Analytics Report</h1>
                <div className="flex justify-between mt-2 text-gray-600">
                    <p>Generated by: System Administrator</p>
                    <p>Date: {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 print:hidden overflow-x-auto pb-2 no-scrollbar">
                {[
                    { id: "books", label: "Borrowing Trends", icon: TrendingUp },
                    { id: "students", label: "Top Students", icon: Users },
                    { id: "demographics", label: "Demographics", icon: PieChartIcon }, // NEW
                    { id: "penalties", label: "Financial Report", icon: DollarSign }
                ].map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 min-w-fit
                                ${activeTab === tab.id
                                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xl scale-105"
                                    : "bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
                                }`}
                        >
                            <Icon size={18} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="grid place-items-center h-96 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-4 border-gray-100 dark:border-slate-700 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
                        </div>
                        <p className="text-gray-400 font-medium animate-pulse">Crunching numbers...</p>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 space-y-8">

                    {/* Borrowed Books Statistics (Replaces Popularity) */}
                    {activeTab === "books" && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                                <div className="p-8 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                                            Statistics of Borrowed Books by Faculty
                                        </h3>
                                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                                            {statistics.academic_year || "A.Y. 2025-2026"}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handlePrintStatistics}
                                        className="print:hidden flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20"
                                    >
                                        <Download size={16} />
                                        Print Statistics
                                    </button>
                                </div>

                                <div className="overflow-x-auto p-2">
                                    <table className="w-full text-center border-collapse border border-gray-300 dark:border-slate-600">
                                        <thead>
                                            {/* Header Row */}
                                            <tr className="bg-gray-100 dark:bg-slate-700">
                                                <th className="border border-gray-300 dark:border-slate-600 p-2 min-w-[100px] bg-gray-200 dark:bg-slate-800">
                                                    {/* Empty for Category/Range */}
                                                </th>
                                                <th colSpan={12} className="border border-gray-300 dark:border-slate-600 p-2 font-bold text-gray-700 dark:text-white uppercase">
                                                    MONTH
                                                </th>
                                                <th className="border border-gray-300 dark:border-slate-600 p-2 min-w-[60px] bg-gray-200 dark:bg-slate-800">
                                                    {/* Total Header */}
                                                </th>
                                            </tr>
                                            <tr className="bg-gray-50 dark:bg-slate-700/50 text-xs font-bold uppercase">
                                                <th className="border border-gray-300 dark:border-slate-600 p-2 text-left">Category / Range</th>
                                                {/* Months: June to May */}
                                                {["JUNE", "JULY", "AUG.", "SEPT.", "OCT.", "NOV.", "DEC.", "JAN", "FEB.", "MAR.", "APR.", "MAY"].map(month => (
                                                    <th key={month} className="border border-gray-300 dark:border-slate-600 p-2">{month}</th>
                                                ))}
                                                <th className="border border-gray-300 dark:border-slate-600 p-2 bg-yellow-50 dark:bg-yellow-900/10">TOTAL</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {statistics.ranges && statistics.ranges.map((range) => {
                                                // Calculate Row Total
                                                const rowTotal = statistics.months.reduce((sum, month) => {
                                                    return sum + (statistics.data[range]?.[month] || 0);
                                                }, 0);

                                                return (
                                                    <tr key={range} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                        <td className="border border-gray-300 dark:border-slate-600 p-2 font-bold text-left bg-gray-50 dark:bg-slate-800">
                                                            {range}
                                                        </td>
                                                        {statistics.months.map(month => (
                                                            <td key={month} className="border border-gray-300 dark:border-slate-600 p-2">
                                                                {(statistics.data[range]?.[month] || 0) > 0 ? (
                                                                    <span className="font-semibold text-gray-800 dark:text-white">
                                                                        {statistics.data[range][month]}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-300 dark:text-slate-600">-</span>
                                                                )}
                                                            </td>
                                                        ))}
                                                        <td className="border border-gray-300 dark:border-slate-600 p-2 font-bold bg-yellow-50 dark:bg-yellow-900/10">
                                                            {rowTotal > 0 ? rowTotal : "-"}
                                                        </td>
                                                    </tr>
                                                );
                                            })}

                                            {/* Grand Total Row */}
                                            <tr className="bg-gray-100 dark:bg-slate-700 font-bold">
                                                <td className="border border-gray-300 dark:border-slate-600 p-3 text-left">TOTAL</td>
                                                {statistics.months && statistics.months.map(month => {
                                                    const colTotal = statistics.ranges.reduce((sum, range) => {
                                                        return sum + (statistics.data[range]?.[month] || 0);
                                                    }, 0);
                                                    return (
                                                        <td key={month} className="border border-gray-300 dark:border-slate-600 p-2">
                                                            {colTotal > 0 ? colTotal : ""}
                                                        </td>
                                                    );
                                                })}
                                                <td className="border border-gray-300 dark:border-slate-600 p-2 bg-yellow-100 dark:bg-yellow-900/20">
                                                    {statistics.ranges && statistics.ranges.reduce((grandTotal, range) => {
                                                        return grandTotal + statistics.months.reduce((sum, month) => {
                                                            return sum + (statistics.data[range]?.[month] || 0);
                                                        }, 0);
                                                    }, 0)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Top Students Section */}
                    {activeTab === "students" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* CHART CARD */}
                                <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 p-8">
                                    <div className="flex justify-between items-center mb-8">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                                <Users className="text-emerald-500" size={24} /> Top Readers
                                            </h3>
                                            <p className="text-gray-400 text-sm mt-1">Students with most borrowing activity</p>
                                        </div>
                                        <button onClick={() => exportCsv("students")} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500">
                                            <Download size={20} />
                                        </button>
                                    </div>
                                    <div className="h-[350px] w-full">
                                        <ResponsiveContainer width="100%" height={350}>
                                            <BarChart data={topStudents.slice(0, 15)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value.split(' ')[0]} />
                                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.4 }} />
                                                <Bar dataKey="borrow_count" name="Books Read" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Student List Table */}
                            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100 dark:border-slate-700">
                                        <tr>
                                            <th className="p-6 font-medium">Rank</th>
                                            <th className="p-6 font-medium">Student</th>
                                            <th className="p-6 font-medium">Course/Year</th> {/* NEW */}
                                            <th className="p-6 font-medium text-center">Active Loans</th>
                                            <th className="p-6 font-medium text-right">Total Reads</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                                        {topStudents.map((student, index) => (
                                            <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                                                <td className="p-6">
                                                    <span className="font-mono text-xs text-gray-400">#{index + 1}</span>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold overflow-hidden">
                                                            {student.profile_picture ? (
                                                                <img src={student.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                                                            ) : (
                                                                student.name.charAt(0)
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-800 dark:text-white">{student.name}</p>
                                                            <p className="text-xs text-gray-500 dark:text-slate-400 font-mono">{student.student_id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* NEW: Detailed Course info */}
                                                <td className="p-6">
                                                    <div>
                                                        <p className="font-medium text-gray-700 dark:text-slate-300">{student.course}</p>
                                                        <p className="text-xs text-gray-500 dark:text-slate-400">{student.year_level} - {student.section}</p>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-center">
                                                    {student.active_loans > 0 ? (
                                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                            {student.active_loans} Active
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="p-6 text-right">
                                                    <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{student.borrow_count}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* NEW: Demographics Section */}
                    {activeTab === "demographics" && (
                        <div className="space-y-6">


                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Course Distribution Chart */}
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 p-8">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-6">
                                        <PieChartIcon className="text-purple-500" size={24} /> Borrowers by Course
                                    </h3>
                                    <div className="h-[350px] w-full">
                                        <ResponsiveContainer width="100%" height={350}>
                                            <PieChart>
                                                <Pie
                                                    data={demographics.by_course}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={120}
                                                    fill="#8884d8"
                                                    dataKey="total"
                                                    nameKey="course"
                                                >
                                                    {demographics.by_course.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip content={<CustomTooltip />} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Year Level Distribution Chart */}
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 p-8">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-6">
                                        <BarChart3 className="text-pink-500" size={24} /> Borrowers by Year Level
                                    </h3>
                                    <div className="h-[350px] w-full">
                                        <ResponsiveContainer width="100%" height={350}>
                                            <BarChart data={demographics.by_year} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                                <XAxis dataKey="year_level" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.4 }} />
                                                <Bar dataKey="total" name="Students" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={50} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Financial Report Section */}
                    {activeTab === "penalties" && (
                        <div className="space-y-6">
                            {/* Summary Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <DollarSign size={80} />
                                    </div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Fines</p>
                                    <h3 className="text-3xl font-bold text-gray-800 dark:text-white">₱{penalties.summary.total_fines?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}</h3>
                                </div>
                                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-2xl shadow-lg relative overflow-hidden text-white">
                                    <p className="text-xs font-bold text-emerald-100 uppercase tracking-widest mb-1">Collected</p>
                                    <h3 className="text-3xl font-bold">₱{penalties.summary.total_collected?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}</h3>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Pending Payment</p>
                                    <h3 className="text-3xl font-bold text-amber-500">₱{penalties.summary.total_pending?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}</h3>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Late Returns</p>
                                    <h3 className="text-3xl font-bold text-red-500">{penalties.summary.total_late_returns || 0}</h3>
                                </div>
                            </div>

                            {/* Revenue Chart */}
                            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                            <TrendingUp className="text-emerald-500" size={24} /> Revenue Trend
                                        </h3>
                                        <p className="text-gray-400 text-sm mt-1">Monthly fine collection analysis</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => exportCsv("penalties")} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500">
                                            <Download size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height={400}>
                                        <AreaChart data={penalties.monthly} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₱${value}`} />
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.4 }} />
                                            <Area type="monotone" dataKey="collected" name="Collected Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCollected)" />
                                            <Area type="monotone" dataKey="pending" name="Pending Fines" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPending)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
