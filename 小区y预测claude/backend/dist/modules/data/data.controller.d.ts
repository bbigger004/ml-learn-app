import { DataService, DataRow } from './data.service';
export declare class DataController {
    private readonly dataService;
    constructor(dataService: DataService);
    uploadFile(file: Express.Multer.File): Promise<{
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
    preprocessData(body: {
        selectedFeatures: string[];
        targetColumn: string;
    }): Promise<{
        success: boolean;
        data: {
            processedData: any[];
            totalRows: number;
            features: string[];
            target: string;
        };
    }>;
}
