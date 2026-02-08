"use client";

import {
  UserGroupIcon,
  HomeIcon,
  DocumentDuplicateIcon,
  PlusCircleIcon,
  ClipboardDocumentListIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Load the NewUserLink client component dynamically to avoid SSR issues
const NewUserLink = dynamic(() => import('./new-user-link'), { ssr: false });

// Primary navigation links
const primaryLinks = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon },
  { name: 'Invoices', href: '/dashboard/invoices', icon: DocumentDuplicateIcon },
  { name: 'Customers', href: '/dashboard/customers', icon: UserGroupIcon },
];

// Action links (grouped separately in the sidebar)
const actionLinks = [{ name: 'Add Expense', href: '/add', icon: PlusCircleIcon }];

// Admin links (only shown to admins)
const adminLinks = [
  { name: 'Pending Requests', href: '/admin/pending-requests', icon: ClipboardDocumentListIcon },
];

export default function NavLinks() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

  useEffect(() => {
    // Fetch pending requests count for admins
    const fetchPendingCount = async () => {
      try {
        const response = await fetch('/api/admin/pending-requests');
        
        const responseText = await response.text();
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          setIsAdmin(false);
          setAdminCheckComplete(true);
          return;
        }
        
        if (response.ok) {
          setIsAdmin(true);
          setPendingCount(data.requests?.length || 0);
        } else if (response.status === 403) {
          setIsAdmin(false);
          setPendingCount(0);
        } else if (response.status === 401) {
          setIsAdmin(false);
          setPendingCount(0);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        setIsAdmin(false);
      } finally {
        setAdminCheckComplete(true);
      }
    };

    // Call immediately
    fetchPendingCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {primaryLinks.map((link) => {
        const LinkIcon = link.icon;
        return (
          <a
            key={link.name}
            href={link.href}
            className="flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3"
          >
            <LinkIcon className="w-6" />
            <p className="hidden md:block">{link.name}</p>
          </a>
        );
      })}

      {/* Actions section */}
      <div className="mt-2 hidden md:block px-2 pt-3 text-xs text-gray-500">Actions</div>
      {actionLinks.map((link) => {
        const LinkIcon = link.icon;
        return (
          <a
            key={link.name}
            href={link.href}
            className="flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3"
          >
            <LinkIcon className="w-6" />
            <p className="hidden md:block">{link.name}</p>
          </a>
        );
      })}

      {/* Admin section - only visible to admins */}
      {isAdmin && (
        <>
          <div className="mt-2 hidden md:block px-2 pt-3 text-xs text-gray-500 flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4" />
            Admin
          </div>
          {adminLinks.map((link) => {
            const LinkIcon = link.icon;
            return (
              <a
                key={link.name}
                href={link.href}
                className="flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3 relative"
              >
                <LinkIcon className="w-6" />
                <p className="hidden md:block">{link.name}</p>
                {pendingCount > 0 && (
                  <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {pendingCount}
                  </span>
                )}
              </a>
            );
          })}
        </>
      )}

      {/* Conditional New User link (client-only) */}
      <div className="mt-4 md:mt-6">
        <NewUserLink />
      </div>
    </>
  );
}
