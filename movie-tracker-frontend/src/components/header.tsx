'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/auth/AuthContext';
import { auth } from '@/lib/firebase/config';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, LogOut, User, Heart, Settings, Sun, Moon, List, Clock, MessageSquare } from 'lucide-react';
import { LoadingSpinner } from './ui/LoadingSpinner';

export function Header() {
  const { user, signOut, loading, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    console.log('Auth state in header:', {
      user: user ? {
        id: user.id,
        email: user.email,
        username: user.username,
        roles: user.roles
      } : null, 
      isAuthenticated,
      loading,
      firebaseLoggedIn: !!auth.currentUser
    });
  }, [user, loading, isAuthenticated])

  const publicNavigation = [
    { name: 'Movies', href: '/movies' },
    { name: 'Reviews', href: '/reviews' }
  ];

  const authNavigation = [
    { name: 'Lists', href: '/lists' },
    { name: 'Watch History', href: '/watch-history' }
  ];

  const allNavigation = [
    ...publicNavigation,
    ...(user ? authNavigation : [])
  ];

  const userNavigation = [
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Watchlist', href: '/lists/watchlist', icon: Clock },
    { name: 'Lists', href: '/lists', icon: List },
    { name: 'Watch History', href: '/watch-history', icon: Clock },
    { name: 'My Reviews', href: '/profile/reviews', icon: MessageSquare },
    { name: 'Favorites', href: '/favorites', icon: Heart },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const MobileNav = () => (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 mt-4">
          {allNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="text-lg"
            >
              {item.name}
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.photoURL || ''} alt={user?.email || ''} />
            <AvatarFallback>
              {user?.email?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
        <div className="flex flex-col space-y-1">
        <p className="text-sm font-medium leading-none">{user?.username || 'User'}</p>
        <p className="text-xs leading-none text-muted-foreground">
        {user?.email || ''}
        </p>
        </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userNavigation.map((item) => (
          <DropdownMenuItem key={item.name} asChild>
            <Link href={item.href} className="flex items-center">
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // If the page is still loading or transitioning, don't render the header yet
  if (loading) {
    return (
      <header className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold">
                CineTrack
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <MobileNav />
            <Link href="/" className="text-xl font-bold">
              CineTrack
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {allNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="mr-2"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
            {loading ? (
              <div className="h-8 w-8">
                <LoadingSpinner size="sm" />
              </div>
            ) : isAuthenticated && user ? (
              <UserMenu />
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}