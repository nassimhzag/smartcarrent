import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

export default function Layout({ children }) {
  return (
    <div className="page-shell">
      <Navbar />
      <main className="content">{children}</main>
      <Footer />
    </div>
  );
}
