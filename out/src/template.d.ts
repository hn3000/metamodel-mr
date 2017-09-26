export interface ITemplateConfig {
    defaults?: any;
    pattern: string | RegExp;
}
export declare class TemplateFactory {
    constructor(config?: ITemplateConfig);
    parse(template: string, defaults?: any): Template;
    private _config;
}
export declare class Template {
    private _parts;
    private _config;
    constructor(templateString: string, defaults?: any, config?: ITemplateConfig);
    render(values: any): string;
    setDefaults(defaults: any): void;
}
export declare function makePattern(pattern: string | RegExp, splitPoint?: string): RegExp;
