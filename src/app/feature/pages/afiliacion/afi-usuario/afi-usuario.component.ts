import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-afi-usuario',
    templateUrl: './afi-usuario.component.html',
    styleUrls: ['./afi-usuario.component.scss']
})
export class AfiUsuarioComponent implements OnInit {

    public currentTab: string = 'datos'; // datos, seguridad, aplicaciones

    // Mock Data del Token
    public tokenData = {
        "_id": { "$oid": "69581ebd324334fe4e3bb73f" },
        "cedula": "100",
        "nombre": "Gestion de Documentos",
        "login": "mppd",
        "cargo": "Administrador",
        "descripcion": "Administrador",
        "correo": "gdoc@gmail.com",
        "estatus": 1,
        "sucursal": "TODAS",
        "direccion": "TODAS",
        "sistema": "mppd.gdoc",
        "observaciones": "Gestion de Documentos",
        "clave": "158209e227f58e3cc429c71eb3f70dd0d17a07cb1f11ca754b7c676b2bfcd11f",
        "firmadigital": {
            "tiempo": "2026-01-02T19:39:17.280Z",
            "nivel": 3,
            "sesion": "b43f121f18753777b21414c6e76e3c569f44d7058bd7874095a2caa5cb01cf61",
            "vigencia": 180,
            "duracion": 180,
            "direccionmac": "",
            "direccionip": ""
        },
        "Perfil": {
            "id": "4d093781ef6bbf331e9e9bc1c151dce8",
            "descripcion": "MPPD Administrador",
            "traza": "ALTA"
        },
        "Aplicacion": [
            {
                "nombre": "GDoc (Gestion De Documentos)",
                "version": "V1.0.0.0",
                "descripcion": "MPPD Administrador",
                "Rol": {
                    "descripcion": "Administrador de Sistema",
                    "Menu": [
                        // ... (I will populate this in the init or leave structured for view)
                        // For brevity in code file I will paste a simplified version or the full one if needed
                        // I'll put the full one in the method to simulate load
                    ]
                }
            }
        ]
    };

    public menus: any[] = [];

    constructor() { }

    ngOnInit(): void {
        // Populate full mock data
        this.tokenData.Aplicacion[0].Rol.Menu = this.getMockMenus();
        this.menus = this.tokenData.Aplicacion[0].Rol.Menu;
    }

    switchTab(tab: string) {
        this.currentTab = tab;
    }

    getMockMenus() {
        return [
            {
                "SubMenu": [],
                "icono": "ni-tv-2",
                "url": "/principal",
                "isExpanded": false,
                "Privilegio": [],
                "accion": "",
                "clase": "text-primary",
                "color": "",
                "descripcion": "Principal",
                "js": "",
                "nombre": "Principal"
            },
            {
                "SubMenu": [
                    {
                        "nombre": "Entradas General",
                        "descripcion": "Entradas General",
                        "icono": "fa fa-plus-circle",
                        "color": "bg-c-green"
                    },
                    {
                        "nombre": "Control de Gestion",
                        "descripcion": "Control de Gestion",
                        "icono": "fa fa-inbox",
                        "color": "bg-c-blue"
                    },
                    {
                        "nombre": "Salidas General",
                        "descripcion": "Salidas General",
                        "icono": "fa fa-share",
                        "color": "bg-c-pink"
                    }
                ],
                "accion": "",
                "color": "",
                "descripcion": "Control y Gestion",
                "icono": "ni-planet",
                "js": "",
                "nombre": "Control y Gestion",
                "Privilegio": [],
                "clase": "text-blue",
                "url": "/control",
                "isExpanded": true
            },
            {
                "clase": "text-red",
                "descripcion": "Ayudantia",
                "js": "",
                "nombre": "Ayudantia",
                "url": "/ayudantia",
                "isExpanded": false,
                "Privilegio": [],
                "SubMenu": [],
                "color": "",
                "icono": "ni-bullet-list-67",
                "accion": ""
            }
        ]; // Simplified for display demo
    }
}
