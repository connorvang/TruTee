interface BroadcastData {
  device_id?: string
  access_code_id?: string
  [key: string]: unknown // Allows for additional properties
}

const clients = new Set<ReadableStreamDefaultController>()

export function broadcast(type: string, data: BroadcastData) {
  const encoder = new TextEncoder()
  const message = encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`)
  
  clients.forEach(client => {
    try {
      client.enqueue(message)
    } catch (error) {
      clients.delete(client)
    }
  })
}

export function addClient(controller: ReadableStreamDefaultController) {
  clients.add(controller)
}

export function removeClient(controller: ReadableStreamDefaultController) {
  clients.delete(controller)
} 