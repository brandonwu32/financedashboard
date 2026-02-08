import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { addAccessRequest, getAccessRequest, checkUserAccess } from '@/app/lib/google-sheets';

// POST /api/access-request - Request access to the application
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized - no email found' }, { status: 401 });
    }

    const body = await request.json();
    const notes = body.notes || '';

    // Check if user already has access
    const access = await checkUserAccess(email);
    if (access.hasAccess) {
      return NextResponse.json({ 
        error: 'Already have access',
        message: 'You already have access to the application'
      }, { status: 400 });
    }

    // Check if user already has a pending request
    const existingRequest = await getAccessRequest(email);
    if (existingRequest) {
      return NextResponse.json({ 
        status: existingRequest.status,
        requestedAt: existingRequest.requestedAt,
        message: `Your access request is ${existingRequest.status.toLowerCase()}`
      });
    }

    // Create new access request
    await addAccessRequest(email, notes);

    return NextResponse.json({ 
      success: true,
      message: 'Access request submitted successfully. You will be notified when approved.'
    });
  } catch (error) {
    console.error('Error handling access request:', error);
    return NextResponse.json({ 
      error: 'Failed to submit access request',
      details: String(error)
    }, { status: 500 });
  }
}

// GET /api/access-request - Check status of access request
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access
    const access = await checkUserAccess(email);
    if (access.hasAccess) {
      return NextResponse.json({ 
        hasAccess: true,
        status: access.status,
        isOnboarded: access.isOnboarded
      });
    }

    // Check for pending request
    const request_data = await getAccessRequest(email);
    if (request_data) {
      return NextResponse.json({
        hasAccess: false,
        requestStatus: request_data.status,
        requestedAt: request_data.requestedAt
      });
    }

    return NextResponse.json({
      hasAccess: false,
      requestStatus: null
    });
  } catch (error) {
    console.error('Error checking access request:', error);
    return NextResponse.json({ 
      error: 'Failed to check access request',
      details: String(error)
    }, { status: 500 });
  }
}
