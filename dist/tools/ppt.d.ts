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
export declare function exportPptx(params: ExportPptxParams): Promise<ExportPptxResult>;
//# sourceMappingURL=ppt.d.ts.map