import { ApplicationConfig, inject, provideEnvironmentInitializer, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withExperimentalAutoCleanupInjectors } from '@angular/router';
import { provideExperimentalWebMcpForms } from '@angular/forms/signals';
import { routes } from './app.routes';
import { provideStudioTools } from './core/webmcp/studio-tools';
import { StudioBridgeService } from './core/bridge/studio-bridge.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding(), withExperimentalAutoCleanupInjectors()),
    provideExperimentalWebMcpForms(),
    ...provideStudioTools(),
    provideEnvironmentInitializer(() => {
      inject(StudioBridgeService);
    }),
  ],
};
