import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingCyberBackground from "../common/FloatingCyberBackground";

export default function PageLayout({ children, hideFooter = false }) {
  return (
    <div className="min-h-screen flex flex-col bg-transparent relative">
      <FloatingCyberBackground />
      <Navbar />
      <main className="flex-1 pt-14 relative z-10">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
