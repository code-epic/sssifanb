export interface RouteInfo {
    path: string;
    title: string;
    icon: string;
    class: string;
}



export const ROUTES: RouteInfo[] = [
    {
        "path": "/principal",
        "title": "Dashboard",
        "icon": "ni ni-spaceship",
        "class": "nav-link",
    },
    {
        "path": "/perfil",
        "title": "Usuario",
        "icon": "ni ni-palette",
        "class": "nav-link",
    },
    {
        "path": "/configurar",
        "title": "Configuración",
        "icon": "ni ni-spaceship",
        "class": "nav-link",
    },
    {
        "path": "/principal",
        "title": "Dashboard",
        "icon": "ni ni-palette",
        "class": "nav-link",
    },
    // {
    //     "path": "/principal",
    //     "title": "Hola",
    //     "icon": "ni ni-palette",
    //     "class": "nav-link",
    // },
    {
        "path": "/template-file",
        "title": "Archivos",
        "icon": "ni ni-active-40",
        "class": "nav-link",
    },

];