export interface DataRow {
    [key: string]: string | number;
}
export declare class DataService {
    private currentData;
    private currentFilePath;
    processUploadedFile(file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        data: {
            filename: string;
            rowCount: number;
            columns: string[];
            preview: DataRow[];
        };
    }>;
    getDataPreview(): Promise<{
        success: boolean;
        data: {
            totalRows: number;
            preview: DataRow[];
            columns: string[];
        };
    }>;
    getColumns(): Promise<{
        success: boolean;
        data: {
            columns: string[];
            columnStats: {};
        };
    }>;
    preprocessData(selectedFeatures: string[], targetColumn: string): Promise<{
        success: boolean;
        data: {
            processedData: any[];
            totalRows: number;
            features: string[];
            target: string;
        };
    }>;
    private parseCSVFile;
    private calculateMedian;
    getCurrentData(): DataRow[];
}
