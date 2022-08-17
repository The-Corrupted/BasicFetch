export type Result<T, E = Error> = { ok: true, value: T } | { ok: false, error: E };

export const Ok = <T>(value: T): Result<T> => {
	return { ok: true, value: value };
}

export const Err = <T>(message: string): Result<T> => {
	return { ok: false, error: new Error(message) };
}
