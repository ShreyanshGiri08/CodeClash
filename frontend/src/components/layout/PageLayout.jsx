import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingCyberBackground from "../common/FloatingCyberBackground";
import PageTransition from "../common/PageTransition";

export default function PageLayout({ children, hideFooter = false }) {
  return (
    <div className="min-h-screen flex flex-col bg-transparent relative overflow-x-hidden">
      <FloatingCyberBackground />
      <Navbar />
      <main className="flex-1 pt-14 relative z-10 flex flex-col">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
