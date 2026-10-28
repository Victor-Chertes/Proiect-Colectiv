import BottomNav from './BottomNav';
import NavbarMenu from './NavbarMenu';

const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col max-w-md mx-auto relative">
      <header className="flex items-center justify-between px-4 py-3 bg-dark-800 border-b border-dark-600 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
          <span className="text-white font-bold tracking-widest text-sm">FITFLOW</span>
        </div>
        <NavbarMenu />
      </header>

      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
