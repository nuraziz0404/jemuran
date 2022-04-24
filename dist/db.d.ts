export declare let conn: import("knex").Knex<any, unknown[]>;
export declare function upState(id: string, state: string, cuaca: string): Promise<Array<object>>;
export declare function getList(id: string): Promise<Array<any> | "err">;
