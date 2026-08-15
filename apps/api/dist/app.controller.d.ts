import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getRoot(): {
        status: string;
        service: string;
        docs: string;
        uptimeSeconds: number;
    };
    getHealth(): {
        status: string;
        service: string;
        docs: string;
        uptimeSeconds: number;
    };
}
