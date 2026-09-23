declare const MODULE_DEFAULTS: {
    readonly about: true;
    readonly coaching: true;
    readonly contact: true;
    readonly testimonials: true;
    readonly events: true;
    readonly blog: true;
    readonly bookings: false;
    readonly exams: false;
    readonly knowledge: false;
    readonly ai_tools: false;
    readonly dynamic_pages: false;
    readonly protected_projects: false;
    readonly dashboard: false;
    readonly flow_game: false;
    readonly zoo_game: false;
    readonly scrum_game: false;
};
type ModuleName = keyof typeof MODULE_DEFAULTS;
/** Whether a module is on, given what the site has saved. Unset means the default. */
declare function moduleIsOn(name: string, settings?: Record<string, unknown> | null): boolean;

export { MODULE_DEFAULTS, type ModuleName, moduleIsOn };
