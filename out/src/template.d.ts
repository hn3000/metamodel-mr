export declare class Template {
    private _parts;
    private _defaults;
    constructor(templateString: string, defaults?: any);
    render(values: any): string;
    setDefaults(defaultValues: any): void;
}
