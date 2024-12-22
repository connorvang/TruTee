import { addClient, removeClient } from './broadcast'

export async function GET() {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      addClient(controller)
      
      try {
        // Send initial connection message
        controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'))
      } catch (error) {
        removeClient(controller)
      }
      
      // Keep-alive interval
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode('data: {"type":"ping"}\n\n'))
        } catch (error) {
          clearInterval(interval)
          removeClient(controller)
        }
      }, 30000)
      
      return () => {
        clearInterval(interval)
        removeClient(controller)
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
} 