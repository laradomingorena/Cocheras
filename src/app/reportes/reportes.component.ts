
import { Component } from '@angular/core';

interface ReporteMensual {
  id: number;
  mes: string;
  usos: number;
  cobrado: number;
}

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent {
  reportes: ReporteMensual[] = [
    { id: 1, mes: 'Enero 2024', usos: 45, cobrado: 67500 },
    { id: 2, mes: 'Febrero 2024', usos: 52, cobrado: 78000 },
    { id: 3, mes: 'Marzo 2024', usos: 38, cobrado: 57000 }
  ];

  header = {
    nro: 'N°',
    mes: 'Mes',
    usos: 'Usos',
    cobrado: 'Cobrado'
  };

  getTotalUsos(): number {
    let total = 0;
    for(let reporte of this.reportes) {
      total += reporte.usos;
    }
    return total;
  }

  getTotalCobrado(): number {
    let total = 0;
    for(let reporte of this.reportes) {
      total += reporte.cobrado;
    }
    return total;
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(valor);
  }
}