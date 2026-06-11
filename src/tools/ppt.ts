import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'fs';
import { join, resolve, basename } from 'path';

const REPO_ROOT = resolve(import.meta.dirname, '../..');
const SKILLS_DIR = join(REPO_ROOT, 'skills', 'ppt-master');
const PROJECT_MANAGER = join(SKILLS_DIR, 'scripts', 'project_manager.py');
const FINALIZE = join(SKILLS_DIR, 'scripts', 'finalize_svg.py');
const SVG_TO_PPTX = join(SKILLS_DIR, 'scripts', 'svg_to_pptx.py');

export interface SvgPage {
  /** Output filename, e.g. "01_cover.svg" */
  filename: string;
  /** Raw SVG XML content */
  svg_content: string;
}

export interface ExportPptxParams {
  /** Project name used as directory prefix */
  project_name: string;
  /** Array of SVG pages to include */
  pages: SvgPage[];
  /** Optional: PPTX format, defaults to ppt169 */
  format?: 'ppt169' | 'ppt43';
}

export interface ExportPptxResult {
  success: boolean;
  pptx_path: string;
  page_count: number;
  error?: string;
}

function runPython(script: string, args: string): string {
  return execSync(`python3 "${script}" ${args}`, {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 60_000,
  });
}

function findProjectDir(namePrefix: string): string {
  const projectsDir = join(REPO_ROOT, 'projects');
  if (!existsSync(projectsDir)) return '';
  const dirs = readdirSync(projectsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith(namePrefix))
    .sort();
  // Return the most recently created (last by name since it includes timestamp)
  return dirs.length > 0 ? join(projectsDir, dirs[dirs.length - 1].name) : '';
}

export async function exportPptx(params: ExportPptxParams): Promise<ExportPptxResult> {
  const { project_name, pages, format = 'ppt169' } = params;

  // Validate prerequisites
  if (!existsSync(PROJECT_MANAGER)) {
    return {
      success: false,
      pptx_path: '',
      page_count: 0,
      error: `ppt-master skill not installed. Install it at: ${SKILLS_DIR}`,
    };
  }

  if (!pages || pages.length === 0) {
    return { success: false, pptx_path: '', page_count: 0, error: 'No SVG pages provided' };
  }

  try {
    // Step 1: Create project
    const initCmd = `init "${project_name}" --format ${format}`;
    runPython(PROJECT_MANAGER, initCmd);

    // Step 2: Find the created project directory
    const projectDir = findProjectDir(project_name);
    if (!projectDir) {
      return { success: false, pptx_path: '', page_count: 0, error: 'Failed to locate created project directory' };
    }

    // Step 3: Write SVG files
    const svgDir = join(projectDir, 'svg_output');
    if (!existsSync(svgDir)) {
      mkdirSync(svgDir, { recursive: true });
    }
    for (const page of pages) {
      writeFileSync(join(svgDir, page.filename), page.svg_content, 'utf-8');
    }

    // Step 4: Run finalize_svg.py
    runPython(FINALIZE, `"${projectDir}"`);

    // Step 5: Run svg_to_pptx.py
    const pptxOutput = runPython(SVG_TO_PPTX, `"${projectDir}"`);

    // Step 6: Find the generated PPTX file
    const exportsDir = join(projectDir, 'exports');
    let pptxPath = '';
    if (existsSync(exportsDir)) {
      const pptxFiles = readdirSync(exportsDir).filter((f) => f.endsWith('.pptx'));
      if (pptxFiles.length > 0) {
        pptxPath = join(exportsDir, pptxFiles[pptxFiles.length - 1]);
      }
    }

    return {
      success: true,
      pptx_path: pptxPath || 'unknown (check stdout)',
      page_count: pages.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      pptx_path: '',
      page_count: 0,
      error: message,
    };
  }
}
