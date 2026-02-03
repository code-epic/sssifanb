import { HttpClient } from '@angular/common/http'; // Asegúrate de importar HttpClient
import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable, timer, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LoginService } from '../login/login.service';
import { jwtDecode } from 'jwt-decode';

// Tipos de mensaje
interface InitialClientMessage {
  ID: string;
  Message: string;
}

// Estados de la conexión
export enum ConnectionStatus {
  DISCONNECTED = 0,
  CONNECTING = 1,
  CONNECTED = 2,
  RECONNECTING = 3,
  ERROR = 4 // Para errores irrecuperables después de los reintentos
}

@Injectable({
  providedIn: 'root'
})
export class SessionService implements OnDestroy {

  private apiUrl = '/v1/api/sandra_sessions'; // Ajusta la URL si es diferente

  private ws!: WebSocket;
  private userId!: string; // Almacenará el ID del usuario
  private userName: string

  private messagesSubject = new Subject<string>(); // Emite mensajes entrantes (string JSON)
  public messages$: Observable<string> = this.messagesSubject.asObservable();

  private connectionStatusSubject = new BehaviorSubject<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  public connectionStatus$: Observable<ConnectionStatus> = this.connectionStatusSubject.asObservable();

  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5; // Límite de intentos de reconexión
  private initialReconnectInterval = 1000; // Intervalo inicial de reconexión en ms (1 segundo)
  private maxReconnectInterval = 30000; // Intervalo máximo de reconexión (30 segundos)

  private messageBuffer: string[] = []; // Buffer para mensajes que no se pudieron enviar

  private readonly destroy$ = new Subject<void>(); // Para desuscribirse al destruir el servicio


  constructor(private http: HttpClient, private loginService: LoginService) {
    this.destroy$.subscribe(() => {
      this.closeConnection();
    })


  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Obtiene la lista de IDs de las sesiones de clientes conectadas.
   * @returns Un Observable que emite un array de strings (los IDs de los clientes).
   */
  getConnectedSessions(): Observable<string[]> {
    return this.http.get<string[]>(this.apiUrl);
  }

  /**
   * Envía un mensaje a las sesiones conectadas.
   * @returns Un Observable que emite un array de strings (los IDs de los clientes).
   */
  sendConnectedSessions(data: any): Observable<string[]> {
    this.apiUrl = '/v1/api/sandra_send-message';
    return this.http.post<string[]>(this.apiUrl, data);
  }

  private getDomain(): string {
    let hostname = window.location.hostname;
    if (hostname.startsWith('consola.')) {
      hostname = hostname.replace('consola.', '');
    }
    return hostname;
  }

  public connect(userId: string, userName: string): void {
    if (sessionStorage.getItem('token') !== undefined) {
      const token: any = jwtDecode(sessionStorage.getItem('token'));

      this.userId = userId;
      this.userName = token.Usuario.usuario;;


      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        console.warn('WebSocketService: Ya hay una conexión activa o en proceso.');
        return;
      }

      this.connectionStatusSubject.next(this.reconnectAttempts === 0 ? ConnectionStatus.CONNECTING : ConnectionStatus.RECONNECTING);

      // Tu URL WebSocket, ahora con el userId en la query
      //const serverUrl = `wss://code-epic.com:8443/sandra_ws?userId=${this.userId}`;
      const domain = this.getDomain();
      const serverUrl = `wss://${domain}:8443/sandra_ws?userId=${this.userId}&userName=${this.userName}`;

      // console.log(`WebSocketService: Intentando conectar a ${serverUrl} (Intento ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

      this.ws = new WebSocket(serverUrl);

      this.ws.onopen = (event) => {
        //  console.log('WebSocketService: Conexión establecida.', event);
        this.connectionStatusSubject.next(ConnectionStatus.CONNECTED);
        this.reconnectAttempts = 0;

        // Mensaje inicial para que tu backend Go registre o actualice la conexión
        const initialMsg: InitialClientMessage = {
          ID: this.userId,
          Message: "Evaluando conexion" // O "init_connection", como prefieras
        };
        this.ws.send(JSON.stringify(initialMsg));
        this.flushMessageBuffer(); // Intenta enviar los mensajes en buffer
      };

      this.ws.onmessage = (event) => {
        this.messagesSubject.next(event.data as string);
      };

      this.ws.onclose = (event) => {
        // console.warn('WebSocketService: Conexión cerrada:', event);
        this.connectionStatusSubject.next(ConnectionStatus.DISCONNECTED);

        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delayMs = Math.min(this.maxReconnectInterval, this.initialReconnectInterval * Math.pow(2, this.reconnectAttempts - 1));

          // console.log(`WebSocketService: Reconectando en ${delayMs / 1000} segundos...`);
          timer(delayMs)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => {
              this.connect(this.userId, this.userName);
            });
        } else if (!event.wasClean) {
          console.error('WebSocketService: Límite de intentos de reconexión alcanzado o cierre irrecuperable.');
          this.connectionStatusSubject.next(ConnectionStatus.ERROR);
        }
      };

      this.ws.onerror = (event) => {
        // console.error('WebSocketService: Error en la conexión:', event);
        // El `onclose` manejará la reconexión.
      };
    }


  }

  public sendMessage(message: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
      console.log('WebSocketService: Mensaje enviado:', message);
    } else {
      console.warn('WebSocketService: Conexión no abierta. Mensaje encolado.');
      this.messageBuffer.push(message);
      // Si estamos desconectados o en error, intenta reconectar para vaciar el buffer
      if (this.connectionStatusSubject.value === ConnectionStatus.DISCONNECTED ||
        this.connectionStatusSubject.value === ConnectionStatus.ERROR) {
        this.connect(this.userId, this.userName);
      }
    }
  }

  private flushMessageBuffer(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.messageBuffer.length > 0) {
      console.log(`WebSocketService: Vaciando buffer (${this.messageBuffer.length} mensajes)...`);
      while (this.messageBuffer.length > 0) {
        const message = this.messageBuffer.shift();
        if (message) {
          this.ws.send(message);
        }
      }
      console.log('WebSocketService: Buffer vaciado.');
    }
  }

  public closeConnection(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocketService: Cerrando conexión...');
      this.ws.close(1000, 'Cliente cerrando conexión limpiamente');
      this.connectionStatusSubject.next(ConnectionStatus.DISCONNECTED);
      this.reconnectAttempts = 0;
    }
  }

}
