export interface WebSocketMessage<T = unknown> {
  type: string
  payload: T
}

export interface WebSocketPort {
  connect(token: string): Promise<void>
  disconnect(): Promise<void>
  send<T>(message: WebSocketMessage<T>): Promise<void>
  onMessage<T>(callback: (message: WebSocketMessage<T>) => void): void
  onConnect(callback: () => void): void
  onDisconnect(callback: () => void): void
  onError(callback: (error: Error) => void): void
} 