import { Injectable, NgZone } from '@angular/core';


import { Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { ConnectionStatus, SessionService } from './session.service';
import { ErrorModalComponent } from 'src/app/shared/components/error-modal/error-modal.component';
import { MessageService } from './message.service';

interface IncomingMessage { // Para otros tipos de mensaje que no sean Ollama chunks
    message: string;
    id: string;
    from: 'bot' | 'user' | 'system'; // 'system' para mensajes de estado/error
}



@Injectable({
    providedIn: 'root'
})
export class WsSandraService {


    public loading: boolean = false; // Indica si estamos esperando respuesta de Ollama
    public currentMessage: string = ''; // Mensaje actual en el input del usuario
    public messages: IncomingMessage[] = []; // Historial de mensajes mostrados en UI

    public connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
    public ConnectionStatus = ConnectionStatus; // Hace el enum accesible en la plantilla HTML

    private userId: string = '';
    private userName: string = '';

    private wsMessagesSubscription!: Subscription;
    private wsStatusSubscription!: Subscription;
    private isErrorModalOpen = false;

    // Propiedades para enviar mensajes directos a IDs de cliente (si aún las usas)
    msjx: string = '';
    idx: string = '';

    constructor(
        private sessionService: SessionService,
        private mensajeService: MessageService,
        private modalService: NgbModal,
        private zone: NgZone
    ) { }


    Run(userName: string) {
        this.userId = localStorage.getItem('userId') || '';
        this.userName = userName

        // console.log('ChatComponent: userId obtenido:', this.userId);
        if (!this.userId) {
            console.error('ChatComponent: No se encontró userId.');
            return;
        }

        this.loadHistory(); // Carga el historial al iniciar
        // 1. Suscribirse a los mensajes del sessionService
        this.wsMessagesSubscription = this.sessionService.messages$.subscribe(
            (dataAsString) => {
                // Intenta parsear el JSON de los chunks de Ollama
                try {
                    const data = JSON.parse(dataAsString);
                    // console.log('ChatComponent: Mensaje WebSocket recibido y parseado:', data);

                    if (data && typeof data.content === 'string' && typeof data.done === 'boolean') {
                        const lastMessage = this.messages[this.messages.length - 1];
                        if (lastMessage && lastMessage.from === 'bot' && this.loading) {
                            lastMessage.message += data.content;
                        } else {
                            this.messages.push({ from: 'bot', message: data.content, id: this.userId });
                        }

                        if (data.done) {
                            console.log('ChatComponent: Respuesta de Ollama terminada.');
                            this.loading = false;
                            this.saveHistory();
                        }
                    } else if (data && typeof data.message === 'string' && typeof data.id === 'string' && typeof data.from === 'string') {
                        this.messages.push({ from: data.from, message: data.message, id: data.id });
                        this.loading = false;
                        this.saveHistory();
                    } else if (data.from === 'exec-pipe') {
                        // Mensaje con formato inesperado
                        // console.log(data)
                        let msj = data.message !== undefined ? data.message : ''
                        if (msj.error !== undefined && msj.error !== '') {
                            this.ErrorMessage(msj.error)
                        }
                        if (data.type === 'restore_finished') {
                            this.OkMessage('El proceso de restauración ha finalizado correctamente')
                        }

                        this.mensajeService.progreso$.emit(data);

                    } else {
                        console.warn('ChatComponent: Mensaje WebSocket con formato inesperado:', dataAsString);
                        this.messages.push({ from: 'bot', message: String(dataAsString), id: this.userId });
                        this.loading = false;
                        this.saveHistory();
                    }
                } catch (e) {
                    // Error al parsear (podría ser un mensaje de texto plano o JSON inválido)
                    // console.error('ChatComponent: Error al parsear mensaje WebSocket:', e, 'Mensaje crudo:', dataAsString);
                    // this.messages.push({ from: 'bot', message: `Error de s ervidor: ${dataAsString.substring(0, 100)}...`, id: this.userId });
                    this.loading = false;
                    this.saveHistory();
                }
            },
            (error) => {
                // Maneja errores emitidos por el Subject de mensajes del servicio (ej. conexión irrecuperable)
                console.error('ChatComponent: Error del sessionService:', error);
                this.messages.push({ from: 'system', message: `Error fatal de conexión: ${error.message}`, id: 'system-error' });
                this.loading = false;
                this.saveHistory();
            }
        );

        // 2. Suscribirse al estado de la conexión del sessionService
        this.wsStatusSubscription = this.sessionService.connectionStatus$.subscribe(status => {
            this.connectionStatus = status;
            // console.log('ChatComponent: Estado de conexión actualizado:', ConnectionStatus[status]);
            // Puedes añadir más lógica aquí para mostrar spinners, mensajes de UI, etc.
        });

        // 3. Conectar al sessionService al iniciar el componente
        this.sessionService.connect(this.userId, this.userName);

        this.obtenerSesiones();
        // console.log('ChatComponent: Inicialización completa.');

    }

    // Nuevo método para cargar el historial desde localStorage.
    private loadHistory(): void {
        const historyString = localStorage.getItem('chat_history');
        if (historyString) {
            this.messages = JSON.parse(historyString);
        }
    }

    obtenerSesiones() {
        this.sessionService.getConnectedSessions().subscribe({
            next: (data) => {
                // console.log(data)
                //Va a contener un array de IDs de clientes conectados
            },
            error: (err) => {
                console.error('Error al obtener sesiones:', err);
            }
        });
    }


    // Método para enviar mensajes al servidor
    public sendMessage(): void {
        if (!this.currentMessage.trim()) {
            return;
        }

        const messageObject = {
            id: this.userId,
            message: this.currentMessage
        };
        const jsonMessage = JSON.stringify(messageObject);

        this.messages.push({ from: 'user', message: this.currentMessage, id: this.userId });
        this.loading = true; // Indica que estamos esperando respuesta de Ollama

        // Usa el servicio para enviar el mensaje
        this.sessionService.sendMessage(jsonMessage);

        this.currentMessage = '';
        this.saveHistory();

    }


    // Nuevo método para guardar el historial en localStorage.
    private saveHistory(): void {

        const historyString = JSON.stringify(this.messages);
        localStorage.setItem('chat_history', historyString);
    }



    sendMClient(): void {
        let data = {
            'clientId': this.idx,
            'message': this.msjx
        }

        this.idx = ''
        this.msjx = ''

        this.sessionService.sendConnectedSessions(data).subscribe({
            next: (data) => {
                console.log(data)
                this.loading = false;
            },
            error: (err) => {
                console.error('Error al enviar mensaje:', err)
                this.loading = false;
            }
        })
    }

    ErrorMessage(texto: string) {
        this.zone.run(() => {
            if (this.isErrorModalOpen) {
                return; // Evita abrir múltiples modales si ya hay uno abierto.
            }
            this.isErrorModalOpen = true;

            const modalRef = this.modalService.open(ErrorModalComponent, {
                centered: true,
                size: 'lg',
                backdrop: false, // 'static' para un fondo que no cierra el modal al hacer clic.
                keyboard: false,
                windowClass: 'fondo-modal' // Clase CSS para estilos personalizados.
            });

            modalRef.componentInstance.errorText = texto;

            // Nos aseguramos de resetear el flag cuando el modal se cierre por cualquier motivo.
            modalRef.result.then(
                () => { this.isErrorModalOpen = false; },
                () => { this.isErrorModalOpen = false; }
            );
        });
    }

    OkMessage(texto: string) {
        Swal.fire({
            title: 'Felicidades',
            text: texto,
            icon: 'success',
            confirmButtonColor: "#3085d6",
            confirmButtonText: "Aceptar",
            allowEscapeKey: true,
        }).then((result) => {

        });
    }
}
