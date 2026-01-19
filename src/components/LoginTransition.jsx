import { useEffect, useState } from "react";
import { Library } from "lucide-react";

const LoginTransition = ({ onFinish }) => {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Show text after book opens (2.5s)
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 2500);

    // Redirect after hold (4.5s total)
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 4500);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md overflow-hidden"
      style={{ backgroundColor: 'rgba(2, 4, 99, 0.95)' }}
    >
      <style>{`
        .book-container {
          perspective: 1500px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 300px;
          height: 400px;
        }

        .book {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transform: rotateY(-30deg);
          animation: book-appear 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* DARK BLUE BOOK COVER */
        .book-cover {
          position: absolute;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #020463 0%, #1a1c7a 100%);
          border-radius: 4px 12px 12px 4px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          transform-origin: left;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.15);
          animation: book-open 3s cubic-bezier(0.645, 0.045, 0.355, 1) 1s forwards;
        }

        /* Book spine effect */
        .book-cover::after {
          content: "";
          position: absolute;
          left: 10px;
          top: 0;
          bottom: 0;
          width: 3px;
          background: rgba(255,255,255,0.2);
          box-shadow: 2px 0 8px rgba(0,0,0,0.3);
        }

        /* Gold/White decorative border on cover */
        .book-cover::before {
          content: "";
          position: absolute;
          inset: 15px;
          border: 2px solid rgba(255, 215, 0, 0.4);
          border-radius: 2px 8px 8px 2px;
          pointer-events: none;
        }

        .book-logo {
          color: white;
          margin-bottom: 16px;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
        }

        .book-title {
          color: white;
          font-size: 18px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          text-align: center;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .book-subtitle {
          color: rgba(255, 215, 0, 0.8);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 3px;
          margin-top: 8px;
        }

        .book-pages {
          position: absolute;
          width: 95%;
          height: 95%;
          background: linear-gradient(to right, #f5f5f5 0%, #ffffff 50%, #f5f5f5 100%);
          border-radius: 2px 8px 8px 2px;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 0 30px rgba(0,0,0,0.08);
          overflow: hidden;
        }

        /* Page lines effect */
        .book-pages::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 10%;
          bottom: 10%;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.1), transparent);
        }

        .book-page-line {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.08), transparent);
        }

        @keyframes book-appear {
          from { opacity: 0; transform: scale(0.8) rotateY(-30deg) translateY(50px); }
          to { opacity: 1; transform: scale(1) rotateY(-30deg) translateY(0); }
        }

        @keyframes book-open {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(-160deg); }
        }

        .welcome-text {
          font-family: 'Inter', sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: #020463;
          text-align: center;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .welcome-text.show {
          opacity: 1;
          transform: translateY(0);
        }

        .welcome-text span {
          color: #1a1c7a;
        }

        .glow-effect {
          position: absolute;
          width: 300%;
          height: 300%;
          background: radial-gradient(circle, rgba(26, 28, 122, 0.2) 0%, transparent 70%);
          pointer-events: none;
          animation: pulse 4s infinite ease-in-out;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.6; }
        }
      `}</style>

      <div className="glow-effect"></div>

      <div className="book-container">
        <div className="book">
          {/* DARK BLUE BOOK COVER with Library Icon */}
          <div className="book-cover">
            <div className="book-logo">
              <Library size={64} strokeWidth={1.5} />
            </div>
            <div className="book-title">PCLU Library</div>
            <div className="book-subtitle">Management System</div>
          </div>

          {/* Book Pages with Welcome Text */}
          <div className="book-pages">
            <div className="book-page-line"></div>
            <div className={`welcome-text ${showText ? 'show' : ''}`}>
              Welcome,<br />
              <span>Admin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginTransition;
