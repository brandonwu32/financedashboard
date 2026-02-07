"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function NewUserLink() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/onboarding/status');
        if (!mounted) return;
        if (!res.ok) {
          setVisible(false);
        } else {
          const json = await res.json();
          // Show link only if user is allowed and not yet onboarded
          setVisible(Boolean(json.allowed && !json.onboarded));
        }
      } catch (e) {
        setVisible(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  if (loading) return null;
  if (!visible) return null;

  return (
    <Link
      href="/new-user"
      className="flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-yellow-50 p-3 text-sm font-medium hover:bg-yellow-100 hover:text-yellow-700 md:flex-none md:justify-start md:p-2 md:px-3"
    >
      <span className="w-6" />
      <p className="hidden md:block">New User</p>
    </Link>
  );
}
