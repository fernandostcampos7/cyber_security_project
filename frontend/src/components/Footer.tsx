const Footer = () => (
  <footer className="bg-charcoal border-t border-roseGold/40">
    <div className="container mx-auto px-4 py-6 text-xs uppercase tracking-[0.2em] text-silver/70">
      <p>© {new Date().getFullYear()} LePax. Crafted with care in Porto.</p>
      <p className="mt-2">We respect your privacy. Manage analytics consent in your account.</p>
    </div>
  </footer>
);

export default Footer;
