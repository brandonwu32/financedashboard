import {
  UserGroupIcon,
  HomeIcon,
  DocumentDuplicateIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';
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

export default function NavLinks() {
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

      {/* Conditional New User link (client-only) */}
      <div className="mt-4 md:mt-6">
        <NewUserLink />
      </div>
    </>
  );
}
