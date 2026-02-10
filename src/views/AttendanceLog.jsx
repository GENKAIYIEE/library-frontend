import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Calendar, ChevronLeft, ChevronRight, ClipboardList, Clock, FileText, Loader2, Printer, RefreshCw, Search, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, LabelList } from "recharts";
import axiosClient from "../axios-client";
import { useLibrarySettings } from "../context/LibrarySettingsContext";

export default function AttendanceLog() {
    const { libraryName } = useLibrarySettings();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [displayDate, setDisplayDate] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [lastRefresh, setLastRefresh] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportLogs, setReportLogs] = useState([]); // Store full list for report
    const [generatingReport, setGeneratingReport] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const pollIntervalRef = useRef(null);
    const currentPageRef = useRef(1);

    // Graph Report State
    const [showGraphModal, setShowGraphModal] = useState(false);
    const [graphData, setGraphData] = useState([]);
    const [graphMonthLabel, setGraphMonthLabel] = useState("");
    const [generatingGraph, setGeneratingGraph] = useState(false);
    const graphRef = useRef(null);


    // Keep ref in sync with state
    useEffect(() => {
        currentPageRef.current = currentPage;
    }, [currentPage]);

    useEffect(() => {
        fetchLogsByDate(selectedDate);

        const today = new Date().toISOString().split('T')[0];
        if (selectedDate === today) {
            pollIntervalRef.current = setInterval(() => {
                // Use ref to get latest current page inside closure
                fetchLogsByDate(selectedDate, true, currentPageRef.current);
            }, 15000);
        }

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [selectedDate]);

    const fetchLogsByDate = async (date, silent = false, page = 1) => {
        if (!silent) setLoading(true);
        if (silent && page > 1) return; // Don't silent poll on other pages for now

        try {
            const response = await axiosClient.get(`/attendance/today?date=${date}&page=${page}`);
            setLogs(response.data.logs || []);
            setTotalCount(response.data.count || 0);
            setDisplayDate(response.data.date || date);

            if (response.data.pagination) {
                setCurrentPage(response.data.pagination.current_page);
                setLastPage(response.data.pagination.last_page);
            }

            setLastRefresh(new Date());
        } catch (err) {
            console.error("Failed to fetch attendance logs:", err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const goToPreviousDay = () => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 1);
        setSelectedDate(prev.toISOString().split('T')[0]);
        setCurrentPage(1);
    };

    const goToNextDay = () => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);
        const today = new Date().toISOString().split('T')[0];
        if (next.toISOString().split('T')[0] <= today) {
            setSelectedDate(next.toISOString().split('T')[0]);
            setCurrentPage(1);
        }
    };

    const goToToday = () => {
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
        setCurrentPage(1); // Reset to page 1
    };

    const handleGenerateReport = async () => {
        setGeneratingReport(true);
        try {
            // Get start and end of the month for selected date
            const date = new Date(selectedDate);
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
            const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

            // Fetch all attendance for the month
            const response = await axiosClient.get(`/attendance/today?start_date=${startOfMonth}&end_date=${endOfMonth}&all=true`);
            const allLogs = response.data.logs || [];

            // Define courses (columns)
            const courses = ['FACULTY', 'IT', 'CRIM', 'MAR', 'EDUC', 'HM/TM', 'BSBA', 'GRAD SC'];

            // Create data structure: { day: { course: count } }
            const monthlyData = {};
            for (let d = 1; d <= daysInMonth; d++) {
                monthlyData[d] = {};
                courses.forEach(c => monthlyData[d][c] = 0);
                monthlyData[d].total = 0;
            }

            // Aggregate logs by day and course
            allLogs.forEach(log => {
                const logDate = new Date(log.logged_at);
                const day = logDate.getDate();
                let course = log.user?.course?.toUpperCase() || 'OTHER';

                // Map course variations
                if (course.includes('CRIMINOLOGY') || course.includes('CRIM')) course = 'CRIM';
                else if (course.includes('MARITIME') || course.includes('MAR')) course = 'MAR';
                else if (course.includes('EDUCATION') || course.includes('EDUC')) course = 'EDUC';
                else if (course.includes('HM') || course.includes('TOURISM') || course.includes('TM')) course = 'HM/TM';
                else if (course.includes('BSBA') || course.includes('BUSINESS')) course = 'BSBA';
                else if (course.includes('GRAD') || course.includes('SC')) course = 'GRAD SC';
                else if (course.includes('IT') || course.includes('INFORMATION')) course = 'IT';
                else if (course.includes('FACULTY')) course = 'FACULTY';
                else course = 'OTHER';

                if (monthlyData[day] && courses.includes(course)) {
                    monthlyData[day][course]++;
                    monthlyData[day].total++;
                } else if (monthlyData[day]) {
                    monthlyData[day].total++;
                }
            });

            // Store data for modal preview and print
            setReportLogs({ monthlyData, courses, daysInMonth, monthLabel: date.toLocaleString('default', { month: 'long', year: 'numeric' }) });
            setShowReportModal(true);
        } catch (error) {
            console.error("Failed to generate report:", error);
        } finally {
            setGeneratingReport(false);
        }
    };

    // Generate Graph Report - Aggregates by course for selected month
    const handleGenerateGraphReport = async () => {
        setGeneratingGraph(true);
        try {
            // Get start and end of the month for selected date
            const date = new Date(selectedDate);
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
            const monthLabel = date.toLocaleString('default', { month: 'long', year: 'numeric' });

            // Fetch all attendance for the month
            const response = await axiosClient.get(`/attendance/today?start_date=${startOfMonth}&end_date=${endOfMonth}&all=true`);
            const allLogs = response.data.logs || [];

            // Aggregate by course
            const courseMap = {};
            allLogs.forEach(log => {
                const course = log.user?.course || 'Unknown';
                courseMap[course] = (courseMap[course] || 0) + 1;
            });

            // Convert to array for chart
            const chartData = Object.entries(courseMap)
                .map(([course, count]) => ({ course, total: count }))
                .sort((a, b) => b.total - a.total);

            setGraphData(chartData);
            setGraphMonthLabel(monthLabel);
            setShowGraphModal(true);
        } catch (error) {
            console.error("Failed to generate graph report:", error);
            // Fallback: aggregate current page logs
            const courseMap = {};
            logs.forEach(log => {
                const course = log.user?.course || 'Unknown';
                courseMap[course] = (courseMap[course] || 0) + 1;
            });
            const chartData = Object.entries(courseMap)
                .map(([course, count]) => ({ course, total: count }))
                .sort((a, b) => b.total - a.total);
            const date = new Date(selectedDate);
            setGraphData(chartData);
            setGraphMonthLabel(date.toLocaleString('default', { month: 'long', year: 'numeric' }));
            setShowGraphModal(true);
        } finally {
            setGeneratingGraph(false);
        }
    };

    const handlePrintReport = () => {
        if (!reportLogs?.monthlyData) return;

        const { monthlyData, courses, daysInMonth, monthLabel } = reportLogs;

        // Check which days are Sundays
        const date = new Date(selectedDate);
        const year = date.getFullYear();
        const month = date.getMonth();

        const getSundays = () => {
            const sundays = [];
            for (let d = 1; d <= daysInMonth; d++) {
                if (new Date(year, month, d).getDay() === 0) sundays.push(d);
            }
            return sundays;
        };
        const sundays = getSundays();

        // Separation of Faculty and Students
        const facultyCourse = courses.find(c => c.toUpperCase() === 'FACULTY');
        const studentCourses = courses.filter(c => c.toUpperCase() !== 'FACULTY');

        // Calculate grand totals
        const grandTotals = {};
        courses.forEach(c => grandTotals[c] = 0);
        grandTotals.total = 0;

        Object.values(monthlyData).forEach(dayData => {
            courses.forEach(c => grandTotals[c] += (dayData[c] || 0));
            grandTotals.total += (dayData.total || 0);
        });

        // Generate table rows
        const tableRows = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const isSunday = sundays.includes(d);
            const rowData = monthlyData[d] || {}; // Handle potential undefined day data

            // Cells for Faculty and Students
            const facultyCell = `<td class="num-col">${facultyCourse ? (rowData[facultyCourse] || '') : ''}</td>`;
            const studentCells = studentCourses.map(c => `<td class="num-col">${rowData[c] || ''}</td>`).join('');

            tableRows.push(`
                <tr>
                    <td class="date-col">${d}</td>
                    ${isSunday ? `<td colspan="${courses.length + 1}" class="sunday">Sunday</td>` : `
                        ${facultyCell}
                        ${studentCells}
                        <td class="num-col total-col">${rowData.total || ''}</td>
                    `}
                </tr>
            `);
        }

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Monthly Statistics - ${monthLabel}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    @page { size: portrait; margin: 0.2in; }
                    html, body { height: 99%; }
                    body { 
                        font-family: 'Times New Roman', serif; 
                        padding: 20px; 
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
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                        border-bottom: 2px solid #000;
                    }
                    .header-logo img {
                        width: 80px;
                        height: 80px;
                    }
                    .header-text { 
                        flex: 1; 
                        text-align: center; 
                        padding: 0 10px;
                    }
                    .header-text h1 { font-size: 16px; color: #000; font-weight: bold; margin-bottom: 2px; }
                    .header-text p { font-size: 11px; color: #000; margin-top: 1px; }
                    
                    .iso-badge {
                        padding: 2px 4px;
                        text-align: center;
                        min-width: 60px;
                    }
                    .iso-badge p { font-size: 9px; font-weight: bold; color: #1e3a8a; }

                    .title {
                        text-align: center;
                        background: #dbeafe;
                        padding: 8px;
                        margin: 15px 0;
                        border-radius: 4px;
                    }
                    .title h2 { font-size: 16px; font-weight: bold; color: #1e3a8a; margin: 0; }
                    .title p { font-size: 12px; margin-top: 2px; color: #334155; }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 15px;
                        flex: 1; /* Allow table to expand if needed, but margin-top auto on signatures is better */
                    }
                    th, td {
                        border: 1px solid #333;
                        padding: 4px 5px;
                        text-align: center;
                        font-size: 10px;
                    }
                    th {
                        background: #dbeafe;
                        color: #1e3a8a;
                        font-weight: bold;
                        padding: 6px 4px; /* Larger header padding */
                        vertical-align: middle;
                    }
                    .date-col { width: 30px; font-weight: bold; color: #000; }
                    .num-col { width: 45px; }
                    .total-col { background: #dbeafe; font-weight: bold; color: #000; }
                    .sunday { 
                        text-align: center; 
                        font-style: italic; 
                        color: #94a3b8;
                        background: #f8fafc;
                        font-size: 10px;
                    }
                    .grand-total { background: #dbeafe; font-weight: bold; }
                    .grand-total td { border-top: 2px solid #1e3a8a; }
                    
                    .signatures {
                        display: flex;
                        justify-content: space-between;
                        margin-top: auto; /* Push to bottom */
                        padding-top: 20px;
                        padding-bottom: 10px;
                        padding-left: 50px;
                        padding-right: 50px;
                    }
                    .signature-box { text-align: center; }
                    .signature-box p { font-size: 10px; margin-bottom: 40px; }
                    .signature-line { 
                        border-top: 1px solid #333; 
                        padding-top: 5px; 
                        width: 180px;
                    }
                    .signature-line span { font-size: 10px; font-weight: bold; }
                    .signature-line small { font-size: 9px; font-style: italic; display: block; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-logo" style="width: 100px; height: 100px; display: flex; align-items: center; justify-content: center;">
                        <img src="${window.location.origin}/pclu-logo.png" alt="PCLU" style="width: 100%; height: 100%; object-fit: contain;" />
                    </div>
                    <div class="header-text">
                        <h1>POLYTECHNIC COLLEGE OF LA UNION (PCLU), INC.</h1>
                        <p>(Formerly PAMETS COLLEGES)</p>
                        <p>Don Pastor L. Panay Sr. Street, San Nicolas Sur, Agoo, La Union 2504</p>
                        <p>Tel. No. (072) 2061761 Mobile No.09171623141/09260953781
                        Email: pclucollege@pclu.com.ph</p>
                        <p>https://www.facebook.com/PCLUOfficialpage</p>
                        <p>Member: Philippine Association of Colleges & Universities</p>
                    </div>
                    <div class="logo-container" style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
                        <span style="font-size: 8px; font-weight: bold; color: #000;">PLIB 014 ISSUE 1 REV 0 061614</span>
                        <div class="iso-badge" style="width: 100px; height: 60px; display: flex; align-items: center; justify-content: center;">
                            <img src="${window.location.origin}/iso-logo.png" alt="GCL ISO Certified" style="width: 100%; height: 100%; object-fit: contain;" />
                        </div>
                    </div>
                </div>

                <div class="title">
                    <h2>MONTHLY STATISTICS</h2>
                    <p>Month: <strong>${monthLabel.toUpperCase()}</strong></p>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th rowspan="2" class="date-col">DATE</th>
                            <th rowspan="2" class="num-col">FACULTY</th>
                            <th colspan="${studentCourses.length}" class="num-col">STUDENTS</th>
                            <th rowspan="2" class="num-col total-col">Grand TOTAL</th>
                        </tr>
                        <tr>
                            ${studentCourses.map(c => `<th class="num-col">${c}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows.join('')}
                        <tr class="grand-total">
                            <td><strong>TOTAL</strong></td>
                            <td class="num-col">${facultyCourse ? (grandTotals[facultyCourse] || 0) : 0}</td>
                            ${studentCourses.map(c => `<td class="num-col">${grandTotals[c] || 0}</td>`).join('')}
                            <td class="total-col">${grandTotals.total || 0}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="signatures">
                    <div class="signature-box">
                        <p>Prepared by:</p>
                        <div class="signature-line">
                            <span>_________________________</span>
                            <small>Circulation Librarian/In-Charge</small>
                        </div>
                    </div>
                    <div class="signature-box">
                        <p>Noted by:</p>
                        <div class="signature-line">
                            <span>_________________________</span>
                            <small>Librarian</small>
                        </div>
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

    // Print Graph Report

    const handlePrintGraphReport = () => {
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Statistics Report - ${graphMonthLabel}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    html, body { height: 99%; }
                    body { 
                        font-family: 'Times New Roman', serif; 
                        padding: 20px; 
                        background: white;
                        color: #000;
                        display: flex;
                        flex-direction: column;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                        border-bottom: 2px solid #000;
                    }
                    .header-logo img {
                        width: 80px;
                        height: 80px;
                    }
                    .header-text { 
                        flex: 1; 
                        text-align: center; 
                        padding: 0 10px;
                    }
                    .header-text h1 { font-size: 16px; color: #000; font-weight: bold; margin-bottom: 2px; }
                    .header-text p { font-size: 11px; color: #000; margin-top: 1px; }

                    .iso-badge {
                        border: 2px solid #1e3a8a;
                        padding: 2px 4px;
                        text-align: center;
                        min-width: 60px;
                    }
                    .iso-badge p { font-size: 9px; font-weight: bold; color: #1e3a8a; }
                    .title { 
                        text-align: center; 
                        font-size: 16px; 
                        font-weight: bold; 
                        margin: 20px 0; 
                    }
                    .chart-container { 
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        background: white;
                        padding: 0;
                        margin-bottom: 10px;
                    }
                    .chart-title { 
                        text-align: center; 
                        font-weight: bold; 
                        background: #dbeafe; 
                        padding: 8px; 
                        margin-bottom: 15px; 
                    }
                    .bar-chart {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        width: 100%;
                    }
                    .signatures { 
                        display: flex; 
                        justify-content: space-between; 
                        margin-top: auto; 
                        padding: 20px 50px 0 50px;
                    }
                    .signature-box { text-align: center; }
                    .signature-line { 
                        border-top: 1px solid #333; 
                        width: 200px; 
                        margin-top: 50px; 
                        padding-top: 8px; 
                    }
                    .signature-box p { font-size: 12px; font-weight: bold; }
                    .signature-box span { font-size: 10px; font-style: italic; color: #666; }
                    
                    /* SVG Styles for Print */
                    .recharts-wrapper { width: 100% !important; height: 100% !important; min-height: 60vh; }
                    .recharts-surface { overflow: visible; width: 100%; height: 100%; }
                    
                    @page { margin: 0.2in; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-logo" style="width: 100px; height: 100px; display: flex; align-items: center; justify-content: center;">
                        <img src="${window.location.origin}/pclu-logo.png" alt="PCLU" style="width: 100%; height: 100%; object-fit: contain;" />
                    </div>
                    <div class="header-text">
                        <h1>POLYTECHNIC COLLEGE OF LA UNION (PCLU), INC.</h1>
                        <p>(Formerly PAMETS COLLEGES)</p>
                        <p>Don Pastor L. Panay Sr. Street, San Nicolas Sur, Agoo, La Union 2504</p>
                        <p>Tel. No. (072) 2061761 Mobile No.09171623141/09260953781
                        Email: pclucollege@pclu.com.ph</p>
                        <p>https://www.facebook.com/PCLUOfficialpage</p>
                        <p>Member: Philippine Association of Colleges & Universities</p>
                    </div>
                    <div class="iso-badge" style="min-width: 100px; border: 1px solid #999; padding: 2px; display: inline-flex; flex-direction: column; align-items: center; background: white;">
                        <div style="background: #1e3a8a; width: 100%; padding: 4px; display: flex; flex-direction: column; align-items: center;">
                            <div style="display: flex; align-items: center; justify-content: center; width: 100%; border-bottom: 1px solid #ffffff40; padding-bottom: 2px; margin-bottom: 2px;">
                                <span style="font-size: 30px; font-weight: 900; line-height: 1; color: white; font-family: Arial, sans-serif;">ISO</span>
                                <div style="display: flex; flex-direction: column; margin-left: 6px; border-left: 1px solid white; padding-left: 6px;">
                                    <span style="font-size: 12px; font-weight: bold; line-height: 1; color: #22d3ee;">9001</span>
                                    <span style="font-size: 12px; font-weight: bold; line-height: 1; color: #22d3ee;">2015</span>
                                </div>
                            </div>
                            <span style="font-size: 11px; font-weight: 900; color: white; letter-spacing: 1px; font-family: Arial, sans-serif; width: 100%; text-align: center;">CERTIFIED</span>
                        </div>
                    </div>
                </div>
                
                <div class="title">STATISTICS FOR THE MONTH OF ${graphMonthLabel.toUpperCase()}</div>
                
                <div class="chart-container">
                    <div class="chart-title">STATISTICS</div>
                    <div class="bar-chart">
                        ${(() => {
                if (graphRef.current) {
                    const svg = graphRef.current.querySelector('svg');
                    if (svg) {
                        // Clone and force dimensions
                        const clone = svg.cloneNode(true);
                        clone.setAttribute('width', '100%');
                        clone.setAttribute('height', '100%');
                        clone.style.width = '100%';
                        clone.style.height = '100%';
                        return clone.outerHTML;
                    }
                }
                return '<p>Graph not loaded</p>';
            })()
            }
                    </div>
                </div>
                
                <div class="signatures">
                    <div class="signature-box">
                        <p>Prepared by:</p>
                        <div class="signature-line">
                            <p style="text-decoration: underline; font-weight: bold;">PATRICIA NIKOLE C. MASILANG</p>
                            <span>College Library Clerk</span>
                        </div>
                    </div>
                    <div class="signature-box">
                        <p>Noted by:</p>
                        <div class="signature-line">
                            <p style="text-decoration: underline; font-weight: bold;">LEAH E. CAMSO.RL MLIS</p>
                            <span>Chief Librarian</span>
                        </div>
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




    const isToday = selectedDate === new Date().toISOString().split('T')[0];

    const getProfileImage = (user) => {
        if (user?.profile_picture_url) {
            return user.profile_picture_url;
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'S')}&background=00008B&color=fff&size=100&bold=true`;
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const filteredLogs = logs.filter(log =>
        log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user?.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            {/* Report Modal */}
            <AnimatePresence>
                {showReportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm report-no-print">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 report-no-print">
                                <div className="flex items-center gap-3">
                                    <FileText className="text-blue-600" size={24} />
                                    <h2 className="text-xl font-bold text-slate-800">Attendance Report Preview</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handlePrintReport}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition-colors"
                                    >
                                        <Printer size={16} />
                                        Print Report
                                    </button>
                                    <button
                                        onClick={() => setShowReportModal(false)}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <X size={20} className="text-slate-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Report Document */}
                            <div className="overflow-auto flex-1 bg-slate-100 p-6">
                                <div
                                    id="report-document"
                                    className="mx-auto max-w-3xl p-10 shadow-lg"
                                    style={{
                                        fontFamily: 'Times New Roman, serif',
                                        backgroundColor: 'white',
                                        color: 'black'
                                    }}
                                >

                                    {/* Report Header */}
                                    {/* Report Header */}
                                    <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-4">
                                        <div className="w-[100px] h-[100px] flex items-center justify-center">
                                            <img src="/pclu-logo.png" alt="PCLU" className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex-1 text-center px-4">
                                            <h1 className="text-[16px] font-bold text-black">POLYTECHNIC COLLEGE OF LA UNION (PCLU), INC.</h1>
                                            <p className="text-[11px] text-black">(Formerly PAMETS COLLEGES)</p>
                                            <p className="text-[11px] text-black">Don Pastor L. Panay Sr. Street, San Nicolas Sur, Agoo, La Union 2504</p>
                                            <p className="text-[11px] text-black">Tel. No. (072) 2061761 Mobile No.09171623141/09260953781</p>
                                            <p className="text-[11px] text-black">Email: pclucollege@pclu.com.ph</p>
                                            <p className="text-[11px] text-black">https://www.facebook.com/PCLUOfficialpage</p>
                                            <p className="text-[11px] text-black mt-1">Member: Philippine Association of Colleges & Universities</p>
                                        </div>
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span className="text-[8px] font-bold text-black leading-none">PLIB 014 ISSUE 1 REV 0 061614</span>
                                            <div className="w-[100px] h-[60px] flex items-center justify-center">
                                                <img src="/iso-logo.png" alt="GCL ISO Certified" className="w-full h-full object-contain" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <div className="bg-blue-100 p-2 text-center mb-4 rounded border border-blue-200">
                                        <h2 className="text-lg font-bold text-blue-900">
                                            MONTHLY STATISTICS
                                        </h2>
                                        <p className="text-sm text-slate-700">
                                            Month: <strong>{reportLogs?.monthLabel?.toUpperCase() || 'N/A'}</strong>
                                        </p>
                                    </div>

                                    {/* Monthly Table */}
                                    {reportLogs?.monthlyData ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse text-xs">
                                                <thead>
                                                    <tr className="bg-slate-200">
                                                        <th rowSpan={2} className="border border-slate-400 px-2 py-1 text-center font-bold w-10 bg-blue-100 text-blue-900">DATE</th>
                                                        <th rowSpan={2} className="border border-slate-400 px-2 py-1 text-center font-bold bg-blue-100 text-blue-900">FACULTY</th>
                                                        <th colSpan={reportLogs.courses.filter(c => c.toUpperCase() !== 'FACULTY').length} className="border border-slate-400 px-2 py-1 text-center font-bold bg-blue-100 text-blue-900">STUDENTS</th>
                                                        <th rowSpan={2} className="border border-slate-400 px-2 py-1 text-center font-bold bg-blue-100 text-blue-900">Grand TOTAL</th>
                                                    </tr>
                                                    <tr className="bg-slate-200">
                                                        {reportLogs.courses.filter(c => c.toUpperCase() !== 'FACULTY').map(c => (
                                                            <th key={c} className="border border-slate-400 px-2 py-1 text-center font-bold text-blue-900">{c}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Array.from({ length: reportLogs.daysInMonth }, (_, i) => i + 1).map(day => {
                                                        const rowData = reportLogs.monthlyData[day] || {};
                                                        const date = new Date(selectedDate);
                                                        const isSunday = new Date(date.getFullYear(), date.getMonth(), day).getDay() === 0;
                                                        const facultyCourse = reportLogs.courses.find(c => c.toUpperCase() === 'FACULTY');
                                                        const studentCourses = reportLogs.courses.filter(c => c.toUpperCase() !== 'FACULTY');

                                                        return (
                                                            <tr key={day} className={isSunday ? 'bg-slate-50' : ''}>
                                                                <td className="border border-slate-300 px-2 py-1 text-center font-bold">{day}</td>
                                                                {isSunday ? (
                                                                    <td colSpan={reportLogs.courses.length + 1} className="border border-slate-300 px-2 py-1 text-center italic text-slate-400">
                                                                        Sunday
                                                                    </td>
                                                                ) : (
                                                                    <>
                                                                        <td className="border border-slate-300 px-2 py-1 text-center">
                                                                            {facultyCourse ? (rowData[facultyCourse] || '') : ''}
                                                                        </td>
                                                                        {studentCourses.map(c => (
                                                                            <td key={c} className="border border-slate-300 px-2 py-1 text-center">
                                                                                {rowData[c] || ''}
                                                                            </td>
                                                                        ))}
                                                                        <td className="border border-slate-300 px-2 py-1 text-center font-bold bg-blue-50">
                                                                            {rowData.total || ''}
                                                                        </td>
                                                                    </>
                                                                )}
                                                            </tr>
                                                        );
                                                    })}
                                                    {/* Grand Total Row */}
                                                    <tr className="bg-blue-100 font-bold text-blue-900">
                                                        <td className="border border-slate-400 px-2 py-1 text-center">TOTAL</td>
                                                        <td className="border border-slate-400 px-2 py-1 text-center">
                                                            {(() => {
                                                                const facultyCourse = reportLogs.courses.find(c => c.toUpperCase() === 'FACULTY');
                                                                return facultyCourse ? Object.values(reportLogs.monthlyData).reduce((sum, day) => sum + (day[facultyCourse] || 0), 0) : 0;
                                                            })()}
                                                        </td>
                                                        {reportLogs.courses.filter(c => c.toUpperCase() !== 'FACULTY').map(c => {
                                                            const total = Object.values(reportLogs.monthlyData).reduce((sum, day) => sum + (day[c] || 0), 0);
                                                            return (
                                                                <td key={c} className="border border-slate-400 px-2 py-1 text-center">{total}</td>
                                                            );
                                                        })}
                                                        <td className="border border-slate-400 px-2 py-1 text-center bg-blue-200">
                                                            {Object.values(reportLogs.monthlyData).reduce((sum, day) => sum + (day.total || 0), 0)}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 text-slate-500 border border-dashed border-slate-300 rounded-lg">
                                            <p>Loading report data...</p>
                                        </div>
                                    )}

                                    {/* Signature Lines */}
                                    <div className="mt-10 flex justify-between px-8">
                                        <div className="text-center">
                                            <p className="text-sm text-slate-600 mb-10">Prepared by:</p>
                                            <div className="border-t border-slate-400 pt-2 w-48">
                                                <p className="text-sm font-semibold uppercase">Patricia Nikole C. Masilang</p>
                                                <p className="text-xs text-slate-500 italic">College Library Clerk</p>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-slate-600 mb-10">Noted by:</p>
                                            <div className="border-t border-slate-400 pt-2 w-48">
                                                <p className="text-sm font-semibold uppercase">Leah E. Camso.RL MLIS</p>
                                                <p className="text-xs text-slate-500 italic">Chief Librarian</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Graph Report Modal */}
            <AnimatePresence>
                {showGraphModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                                <div className="flex items-center gap-3">
                                    <BarChart3 className="text-amber-600" size={24} />
                                    <h2 className="text-xl font-bold text-slate-800">Monthly Statistics Report</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handlePrintGraphReport}
                                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-sm transition-colors"
                                    >
                                        <Printer size={16} /> Print Report
                                    </button>
                                    <button
                                        onClick={() => setShowGraphModal(false)}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <X size={20} className="text-slate-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Graph Preview */}
                            <div className="overflow-auto flex-1 bg-slate-100 p-6">
                                <div className="mx-auto max-w-3xl p-8 shadow-lg bg-white">
                                    {/* Header */}
                                    {/* Header */}
                                    <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
                                        <div className="w-[100px] h-[100px] flex items-center justify-center">
                                            <img src="/pclu-logo.png" alt="PCLU" className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex-1 text-center px-4">
                                            <h1 className="text-[16px] font-bold text-black">POLYTECHNIC COLLEGE OF LA UNION (PCLU), INC.</h1>
                                            <p className="text-[11px] text-black">(Formerly PAMETS COLLEGES)</p>
                                            <p className="text-[11px] text-black">Don Pastor L. Panay Sr. Street, San Nicolas Sur, Agoo, La Union 2504</p>
                                            <p className="text-[11px] text-black">Tel. No. (072) 2061761 Mobile No.09171623141/09260953781</p>
                                            <p className="text-[11px] text-black">Email: pclucollege@pclu.com.ph</p>
                                            <p className="text-[11px] text-black">https://www.facebook.com/PCLUOfficialpage</p>
                                            <p className="text-[11px] text-black mt-1">Member: Philippine Association of Colleges & Universities</p>
                                        </div>
                                        <div className="isolate flex flex-col items-center justify-center border border-slate-400 bg-white p-0.5 min-w-[100px]">
                                            <div className="bg-blue-900 w-full p-1 flex flex-col items-center">
                                                <div className="flex w-full items-center justify-center border-b border-blue-800 pb-0.5 mb-0.5">
                                                    <span className="text-4xl font-black leading-none text-white">ISO</span>
                                                    <div className="ml-1.5 flex flex-col border-l border-white/50 pl-1.5">
                                                        <span className="text-xs font-bold leading-none text-cyan-400">9001</span>
                                                        <span className="text-xs font-bold leading-none text-cyan-400">2015</span>
                                                    </div>
                                                </div>
                                                <span className="text-[11px] font-black leading-none tracking-widest text-white">CERTIFIED</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <div className="bg-blue-100 p-2 text-center mb-6 rounded border border-blue-200">
                                        <h2 className="text-lg font-bold text-blue-900">
                                            STATISTICS FOR THE MONTH OF {graphMonthLabel.toUpperCase()}
                                        </h2>
                                    </div>

                                    {/* Chart */}
                                    <div className="bg-slate-50 p-6 rounded-lg mb-8">
                                        <h3 className="text-center font-bold text-slate-700 mb-4 bg-blue-100 py-2">STATISTICS</h3>
                                        {graphData.length > 0 ? (
                                            <div className="h-[350px] w-full" ref={graphRef}>
                                                <ResponsiveContainer width="100%" height={350}>
                                                    <BarChart data={graphData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                                                        <defs>
                                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                                                                <stop offset="95%" stopColor="#d97706" stopOpacity={1} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                        <XAxis
                                                            dataKey="course"
                                                            angle={0}
                                                            textAnchor="middle"
                                                            height={30}
                                                            fontSize={12}
                                                            stroke="#374151"
                                                            fontWeight="bold"
                                                            interval={0}
                                                        />
                                                        <YAxis stroke="#374151" fontSize={12} />
                                                        <Bar dataKey="total" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={50}>
                                                            <LabelList dataKey="total" position="top" fontSize={14} fontWeight="bold" fill="#374151" />
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <div className="text-center py-10 text-slate-500">
                                                No data available for this month.
                                            </div>
                                        )}

                                    </div>

                                    {/* Signatures */}
                                    <div className="flex justify-between mt-12 px-8">
                                        <div className="text-center">
                                            <p className="text-sm text-slate-600">Prepared by:</p>
                                            <div className="border-t border-slate-400 mt-10 pt-2 w-48">
                                                <p className="text-sm font-semibold uppercase">Patricia Nikole C. Masilang</p>
                                                <p className="text-xs text-slate-500 italic">College Library Clerk</p>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-slate-600">Noted by:</p>
                                            <div className="border-t border-slate-400 mt-10 pt-2 w-48">
                                                <p className="text-sm font-semibold uppercase">Leah E. Camso.RL MLIS</p>
                                                <p className="text-xs text-slate-500 italic">Chief Librarian</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header with Date Navigation */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <ClipboardList className="text-blue-600" size={28} />
                        Attendance Log
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Library attendance history and reports
                    </p>
                </div>

                {/* Date Navigation Controls */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={goToPreviousDay}
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        title="Previous Day"
                    >
                        <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>

                    <input
                        type="date"
                        value={selectedDate}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                            setSelectedDate(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />

                    <button
                        onClick={goToNextDay}
                        disabled={isToday}
                        className={`p-2 rounded-lg transition-colors ${isToday ? 'bg-slate-50 dark:bg-slate-800 cursor-not-allowed opacity-50' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                        title="Next Day"
                    >
                        <ChevronRight size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>

                    <button
                        onClick={goToToday}
                        disabled={isToday}
                        className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${isToday ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 cursor-default' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                        Today
                    </button>

                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1" />

                    <button
                        onClick={handleGenerateReport}
                        disabled={loading || generatingReport}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-colors"
                        title="Generate Printable Report"
                    >
                        {generatingReport ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                        Generate Report
                    </button>

                    <button
                        onClick={handleGenerateGraphReport}
                        disabled={loading || generatingGraph}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-colors"
                        title="Generate Monthly Statistics Graph"
                    >
                        {generatingGraph ? <Loader2 size={16} className="animate-spin" /> : <BarChart3 size={16} />}
                        Print Statistics
                    </button>

                    <button
                        onClick={() => fetchLogsByDate(selectedDate)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">Total Visitors</p>
                            <p className="text-4xl font-black mt-1">{totalCount}</p>
                        </div>
                        <Users className="text-blue-200" size={48} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Viewing Date</p>
                            <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{displayDate}</p>
                        </div>
                        <Calendar className="text-slate-400" size={36} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Last Updated</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white mt-1">
                                {lastRefresh ? formatTime(lastRefresh) : '--'}
                            </p>
                        </div>
                        <Clock className={`text-green-500 ${isToday ? 'animate-pulse' : ''}`} size={36} />
                    </div>
                    {isToday && <p className="text-xs text-green-600 mt-2 font-medium">● Auto-refreshing every 15s</p>}
                </div>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-3" />
                        <p className="text-slate-500">Loading attendance logs...</p>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-12 text-center">
                        <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No attendance records for {displayDate}</p>
                        <p className="text-slate-400 text-sm">Try selecting a different date</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">ID Number</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Course</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Year</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Time In</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                <AnimatePresence>
                                    {filteredLogs.map((log, index) => (
                                        <motion.tr
                                            key={log.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3, delay: index * 0.02 }}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={getProfileImage(log.user)}
                                                        alt={log.user?.name}
                                                        className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
                                                    />
                                                    <span className="font-semibold text-slate-800 dark:text-white">
                                                        {log.user?.name || 'Unknown'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                                                    {log.user?.student_id || '--'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                {log.user?.course || '--'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                {log.user?.year_level || '--'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-bold">
                                                    <Clock size={14} />
                                                    {formatTime(log.logged_at)}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {/* Pagination Controls */}
            {lastPage > 1 && (
                <div className="flex items-center justify-between mt-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Page <span className="font-bold text-slate-800 dark:text-white">{currentPage}</span> of <span className="font-bold text-slate-800 dark:text-white">{lastPage}</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => fetchLogsByDate(selectedDate, false, currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                        >
                            <ChevronLeft size={16} />
                            Previous
                        </button>
                        <button
                            onClick={() => fetchLogsByDate(selectedDate, false, currentPage + 1)}
                            disabled={currentPage === lastPage}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            Next
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
