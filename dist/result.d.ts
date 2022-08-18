export declare type Result<T, E = Error> = {
    ok: true;
    value: T;
} | {
    ok: false;
    error: E;
};
export declare const Ok: <T>(value: T) => Result<T, Error>;
export declare const Err: <T>(message: string) => Result<T, Error>;
