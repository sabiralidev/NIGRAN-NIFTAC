import Header from '../components/Header/Header';
import TopNav from '../components/nav/TopNav';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const DashboardLayout = ({ children }) => {
  const location = useLocation();

  // The unified platform/section nav belongs to the dashboard family. Activity is its
  // own full-width page with its own platform filter.
  const showNav = !location.pathname.startsWith('/activity');

  return (
    <div className="min-h-screen">
      <Header />
      {/* NOTE: was hardcoded pt-[76px]. Header's real height changes across
          breakpoints (it grows on mobile/tablet because of the extra
          Overview/Accounts/Alerts/Activity strip row). Header measures itself
          live via ResizeObserver and exposes --header-height on :root, so we
          read that here instead of guessing a fixed pixel value. This keeps
          content and TopNav from ever sliding under the header, at any
          screen size. */}
      <div style={{ paddingTop: 'var(--header-height, 76px)' }}>
        {showNav && <TopNav />}
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          id="main-content"
        >
          {/* One container for every page - no sidebar - so the content width is
              identical on every route and always aligns with the command bar. */}
          <div className="mx-auto max-w-[1900px] px-4 pb-10 pt-5 sm:px-6 lg:px-8 xl:px-10">
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default DashboardLayout;