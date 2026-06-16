import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withExperimentalAutoCleanupInjectors } from '@angular/router';
import { provideExperimentalWebMcpForms } from '@angular/forms/signals';
import { routes } from './app.routes';
import { provideStudioTools } from './core/webmcp/studio-tools';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withExperimentalAutoCleanupInjectors(), withComponentInputBinding()),
    // Convierte Signal Forms en tools WebMCP.
    provideExperimentalWebMcpForms(),
    // Tools de nivel-app (greet, ping_studio).
    ...provideStudioTools(),
  ],
};
