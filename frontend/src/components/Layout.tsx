import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-charcoal text-silver min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
    <Footer />
  </div>
);

export default Layout;
