import React, { useEffect, useState } from 'react';

export default function PrintLibraryCard() {
    const [student, setStudent] = useState(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const data = localStorage.getItem('print_student_data');
        if (data) {
            setStudent(JSON.parse(data));
            setReady(true);
            setTimeout(() => {
                window.print();
            }, 1500);
        }
    }, []);

    if (!student) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f1f5f9' }}>
                <p>Loading Card Data...</p>
            </div>
        );
    }

    return (
        <html>
            <head>
                <title>Library Card - {student.name}</title>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        background: #e2e8f0;
                    }
                    @media print {
                        @page { 
                            size: A4 portrait; 
                            margin: 10mm; 
                        }
                        body { 
                            background: white !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .no-print { display: none !important; }
                        .card { 
                            box-shadow: none !important; 
                            border: 1px solid #999 !important;
                            margin-bottom: 10mm !important;
                        }
                    }
                    .card {
                        width: 323px;
                        height: 204px;
                        background: white;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                        margin: 0 auto 20px auto;
                        border: 1px solid #cbd5e1;
                    }
                    .header-front {
                        width: 100%;
                        height: 54px;
                        background: #00008B;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 0 12px;
                    }
                    .header-back {
                        width: 100%;
                        height: 30px;
                        background: #00008B;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .gold-bar {
                        width: 100%;
                        height: 10px;
                        background: #FCD34D;
                    }
                    .content {
                        flex: 1;
                        display: flex;
                        padding: 8px 10px;
                        gap: 10px;
                        background: #f8fafc;
                        height: 140px;
                    }
                    .content-back {
                        padding: 8px 12px;
                        background: white;
                        height: 164px;
                        display: flex;
                        flex-direction: column;
                    }
                    .photo-box {
                        width: 80px;
                        height: 100px;
                        border: 2px solid #00008B;
                        border-radius: 4px;
                        overflow: hidden;
                        flex-shrink: 0;
                    }
                    .photo-box img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                    .details {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                    }
                    .label {
                        font-size: 7px;
                        font-weight: bold;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 1px;
                    }
                    .value {
                        font-size: 10px;
                        font-weight: bold;
                        color: #00008B;
                    }
                    .value-large {
                        font-size: 12px;
                        font-weight: 800;
                        color: #00008B;
                        text-transform: uppercase;
                    }
                    .sig-line {
                        border-bottom: 1px solid #94a3b8;
                        width: 90px;
                        height: 14px;
                        margin-top: 6px;
                    }
                ` }} />
            </head>
            <body>
                {/* Controls - Screen Only */}
                <div className="no-print" style={{ padding: '30px', textAlign: 'center', background: '#e2e8f0' }}>
                    <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>Library Card Preview</h1>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                        Both cards are shown below. The print dialog will open automatically.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button onClick={() => window.print()} style={{ padding: '10px 20px', backgroundColor: '#00008B', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                            🖨️ Print Cards
                        </button>
                        <button onClick={() => window.close()} style={{ padding: '10px 20px', backgroundColor: 'white', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                            Close
                        </button>
                    </div>
                </div>

                {/* PRINTABLE AREA - Both cards stacked vertically */}
                <div style={{ padding: '20px', background: '#e2e8f0' }} className="print-area">

                    {/* CARD FRONT */}
                    <div className="card">
                        <div className="header-front">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,0.3)' }}>
                                    <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#FCD34D' }}>PCLU</span>
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: '800', color: 'white', textTransform: 'uppercase' }}>Polytechnic College</div>
                                    <div style={{ fontSize: '8px', fontWeight: '700', color: '#FCD34D', textTransform: 'uppercase' }}>of La Union</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '6px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase' }}>Library System</div>
                                <div style={{ fontSize: '7px', fontWeight: '700', color: '#00008B', backgroundColor: '#FCD34D', padding: '2px 6px', borderRadius: '2px', marginTop: '2px', display: 'inline-block' }}>STUDENT ID</div>
                            </div>
                        </div>
                        <div className="content">
                            <div className="photo-box">
                                <img
                                    src={
                                        student.profile_picture_url
                                            ? student.profile_picture_url
                                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=00008B&color=fff&size=200&bold=true`
                                    }
                                    alt="Student"
                                />
                            </div>
                            <div className="details">
                                <div>
                                    <div className="label">Student Name</div>
                                    <div className="value-large">{student.name}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div>
                                        <div className="label">ID Number</div>
                                        <div className="value" style={{ fontFamily: 'monospace' }}>{student.student_id}</div>
                                    </div>
                                    <div>
                                        <div className="label">Course / Year</div>
                                        <div className="value">{student.course || 'N/A'} - {student.year_level || '1'}</div>
                                    </div>
                                </div>
                                <div>
                                    <div className="sig-line"></div>
                                    <div className="label" style={{ marginTop: '2px' }}>Student Signature</div>
                                </div>
                            </div>
                        </div>
                        <div className="gold-bar"></div>
                    </div>

                    {/* CARD BACK */}
                    <div className="card">
                        <div className="header-back">
                            <span style={{ fontSize: '8px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase', letterSpacing: '1px' }}>Terms & Conditions</span>
                        </div>
                        <div className="content-back">
                            <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '7.5px', color: '#334155', lineHeight: '1.6' }}>
                                <li style={{ marginBottom: '3px' }}><strong style={{ color: '#00008B' }}>Non-Transferable:</strong> For the exclusive use of the named cardholder.</li>
                                <li style={{ marginBottom: '3px' }}><strong style={{ color: '#00008B' }}>Lost Cards:</strong> Report to the Library Office immediately.</li>
                                <li style={{ marginBottom: '3px' }}><strong style={{ color: '#00008B' }}>Validity:</strong> Valid for the current academic year.</li>
                                <li>Surrender upon withdrawal, graduation, or transfer.</li>
                            </ul>
                            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div style={{ fontSize: '6px', color: '#94a3b8', fontFamily: 'monospace' }}>A.Y. {new Date().getFullYear()}-{new Date().getFullYear() + 1}</div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontFamily: 'cursive', fontSize: '13px', color: '#00008B', marginBottom: '-3px' }}>Alethe Backid</div>
                                    <div style={{ width: '100px', borderBottom: '1.5px solid #00008B', marginBottom: '3px' }}></div>
                                    <div style={{ fontSize: '7px', fontWeight: 'bold', color: '#00008B', textTransform: 'uppercase' }}>Alethe Joy K. Backid, RL, MLIS</div>
                                    <div style={{ fontSize: '6px', fontWeight: 'bold', color: 'white', backgroundColor: '#00008B', padding: '2px 5px', borderRadius: '2px', marginTop: '2px', display: 'inline-block' }}>Chief Librarian</div>
                                </div>
                            </div>
                        </div>
                        <div className="gold-bar"></div>
                    </div>
                </div>
            </body>
        </html>
    );
}
