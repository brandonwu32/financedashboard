import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { checkUserAccess, getPendingRequests } from '@/app/lib/google-sheets';

// GET /api/admin/pending-requests - Get all pending access requests
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is an admin
    const access = await checkUserAccess(email);
    
    // Debug logging
    console.log(`Admin check for ${email}:`, {
      hasAccess: access.hasAccess,
      status: access.status,
      isAdmin: access.isAdmin,
      isOnboarded: access.isOnboarded,
    });
    
    if (!access.isAdmin) {
      return NextResponse.json({ 
        error: 'Forbidden - Admin access required',
        debug: {
          email,
          access,
        }
      }, { status: 403 });
    }

    // Get all pending requests
    const requests = await getPendingRequests();

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch pending requests',
      details: String(error)
    }, { status: 500 });
  }
}

