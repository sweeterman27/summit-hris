import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notificationEvents } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const employeeNo = (session.user as any).employeeNo;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const onNotification = (data: any) => {
        if (data.userId === employeeNo || data.userId === 'ALL') {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch (e) {
            console.error('SSE Stream enqueue error:', e);
          }
        }
      };

      notificationEvents.on('notification', onNotification);

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch (e) {
          // Stream might be closed
          clearInterval(heartbeat);
        }
      }, 20000); // 20s heartbeat for tighter stability

      req.signal.onabort = () => {
        notificationEvents.off('notification', onNotification);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch (e) {
          // Already closed
        }
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering for Nginx/Proxies
    },
  });
}
