import { Injectable, inject } from '@angular/core';
import { ComponentTreeStore } from '../state/component-tree.store';
import { ProjectStore } from '../state/project.store';
import { TelemetryStore } from '../state/telemetry.store';
import {
  generateAngularProject,
  slugifyProjectName,
  summarizeExport,
} from './angular-project-generator';
import { createProjectZip, downloadBlob } from './project-zip';

export interface ExportAngularResult {
  projectName: string;
  slug: string;
  fileCount: number;
  paths: string[];
  downloaded: boolean;
  summary: string;
}

/**
 * Exporta el árbol actual como proyecto Angular standalone descargable en ZIP.
 */
@Injectable({ providedIn: 'root' })
export class ProjectExportService {
  private readonly tree = inject(ComponentTreeStore);
  private readonly projects = inject(ProjectStore);
  private readonly telemetry = inject(TelemetryStore);

  async exportAsZip(projectName?: string): Promise<ExportAngularResult> {
    const name = (projectName?.trim() || this.projects.currentName() || 'studio-export').trim();
    const slug = slugifyProjectName(name);
    const files = generateAngularProject(this.tree.state(), name);
    const paths = Object.keys(files).sort();
    const blob = await createProjectZip(files);
    downloadBlob(blob, `${slug}.zip`);
    this.telemetry.record('export', 'angular_zip');
    this.projects.status.set(`Proyecto Angular descargado: ${slug}.zip`);
    const summary = summarizeExport(files, name);
    return {
      projectName: name,
      slug,
      fileCount: paths.length,
      paths,
      downloaded: true,
      summary,
    };
  }
}
