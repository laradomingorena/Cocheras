import { Estacionamiento } from "./estacionamiento";

export interface Cochera{
    id:number,
    descripcion: string,
    deshabilitada: boolean,
    eliminada: boolean,
    activo: Estacionamiento|null
}