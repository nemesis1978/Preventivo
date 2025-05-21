// frontend/src/components/layout/Navbar.tsx
'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Menu, X } from 'lucide-react'; // Using lucide-react for icons
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const Navbar = () => {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Preventivo App
        </Link>

        {/* Hamburger Menu Button - visible on small screens */}
        <div className="md:hidden">
          <Button onClick={toggleMobileMenu} variant="ghost" size="icon" className="text-white hover:bg-gray-700" aria-expanded={isMobileMenuOpen} aria-controls="mobile-menu">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>

        {/* Desktop Menu - hidden on small screens, visible on medium and up */}
        <div className="hidden md:flex space-x-4 items-center">
          <Link href="/" className="hover:text-gray-100">
            Home
          </Link>
          <Link href="/tips" className="hover:text-gray-100">
            Investment Tips
          </Link>
          {isLoading ? (
            <p>Loading...</p>
          ) : session ? (
            <>
              <span className="text-sm">{session.user?.email}</span>
              <Button onClick={() => signOut()} variant="outline" size="sm" className="text-gray-800 bg-white hover:bg-gray-100">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hover:text-gray-100">
                Login
              </Link>
              <Link href="/auth/register" className="hover:text-gray-100">
                Registrati
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Menu - shown below navbar when open */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            id="mobile-menu"
            className="md:hidden mt-4 space-y-2 flex flex-col items-start"
          >
            <Link href="/" className="hover:text-gray-100 block w-full p-2 rounded hover:bg-gray-700" onClick={toggleMobileMenu}>
              Home
            </Link>
            <Link href="/tips" className="hover:text-gray-100 block w-full p-2 rounded hover:bg-gray-700" onClick={toggleMobileMenu}>
              Investment Tips
            </Link>
            {isLoading ? (
              <p className="p-2">Loading...</p>
            ) : session ? (
              <>
                <span className="text-sm p-2">{session.user?.email}</span>
                <Button onClick={() => { signOut(); toggleMobileMenu(); }} variant="outline" size="sm" className="text-gray-800 bg-white hover:bg-gray-100 w-full justify-start p-2">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="hover:text-gray-100 block w-full p-2 rounded hover:bg-gray-700" onClick={toggleMobileMenu}>
                  Login
                </Link>
                <Link href="/auth/register" className="hover:text-gray-100 block w-full p-2 rounded hover:bg-gray-700" onClick={toggleMobileMenu}>
                  Registrati
                </Link>
              </>
            )}
            <div className="mt-2 p-2">
              <ThemeToggle />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;