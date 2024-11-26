import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from '../../components/header/header.component';
import { Inject } from '@angular/core';
import Swal from 'sweetalert2';
import { Estacionamiento } from '../../interfaces/estacionamiento';
import { EstacionamientoService } from '../../services/estacionamiento.service';
import { Reporte } from "../../interfaces/reportes";


@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [RouterModule, CommonModule, HeaderComponent],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss'
})
export class ReportesComponent {


  titulo: string = 'Reportes';
  //header: { nro: string, disponibilidad: string, ingreso: string, acciones: string } = {
  //  nro: 'Nro',
  //  disponibilidad: 'Disponibilidad',
  //  ingreso: 'Ingreso',
  //  acciones: 'Acciones',
  //};


  estacionamientos = inject(EstacionamientoService);

  historialEstacionamientos: Estacionamiento[] = [];
  reporteEstacionamientos: Reporte[] = [];

  ngOnInit() {
    //this.traerCocheras();
  }
  auth = inject(AuthService);

  siguienteNumero: number = 1;
  costoPorHora: number = 0;
}
