import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/layout').then(m => m.Layout),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () => import('./home/home').then(m => m.Home),
      },
      {
        path: 'incident/dashboard',
        loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
      },
      {
        path: 'incident/summary',
        loadComponent: () => import('./incident-report/incident-sum').then(m => m.IncidentSum),
      },
      {
        path: 'incident/edit',
        loadComponent: () => import('./incident-report/incident-edit').then(m => m.IncidentEdit),
      },
      {
        path: 'rescue/map',
        loadComponent: () => import('./all-rescue/rescue-map').then(m => m.RescueMap),
      },
      {
        path: 'rescue/summary',
        loadComponent: () => import('./all-rescue/rescue-sum').then(m => m.RescueSum),
      },
      {
        path: 'rescue/edit',
        loadComponent: () => import('./all-rescue/rescue-edit').then(m => m.RescueEdit),
      },
    ],
  },
];
