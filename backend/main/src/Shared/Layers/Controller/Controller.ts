import * as HttpType from "src/Shared/Utils/HttpMethodTypes";
import { RepositoryError } from "src/Shared/Layers/Repository/RepositoryError";

/**
 * This is the controller class.
 * All controller in this should extend this class.
 */
export abstract class Controller<
	T extends object | string | null | undefined,
	U = undefined,
> {
	/**
	 * You implement your login in this function.
	 * @param input
	 * @protected
	 */
	protected abstract handler(input: T): Promise<ControllerResultType<U>>;

	/**
	 * you call this function form outside.
	 */
	public async execute(input: T): Promise<ControllerResultType<U>> {
		try {
			return await this.handler(input);
		} catch (err) {
			if (err instanceof RepositoryError) {
				// do the error logging
				err.describeError();
				return this.internalServerError(err.message);
			}

			if (err instanceof Error) {
				console.error(err.message);
				return this.internalServerError(err.message);
			}

			return this.internalServerError("unexpected error");
		}
	}

	/**
	 * OK
	 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200}
	 * status code: 200
	 * body: serialized json string. it can be null.
	 *
	 * You can set an object in the argument. IF so, the object is serialized.
	 * @param body
	 */
	ok(body: U): HttpType.OkStatus<U> {
		return {
			status: "OK",
			statusCode: 200,
			body,
		};
	}

	/**
	 * Created
	 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/201}
	 * status code: 201
	 * body: serialized json string. it can be null.
	 *
	 * You can set an object in the argument. IF so, the object is serialized.
	 * @param body
	 */
	created(body: U): HttpType.CreatedStatus<U> {
		return {
			status: "CREATED",
			statusCode: 201,
			body,
		};
	}

	/**
	 * accepted
	 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/202}
	 * status code: 202
	 */
	accepted(): HttpType.AcceptedStatus {
		return {
			status: "ACCEPTED",
			statusCode: 202,
			body: undefined,
		};
	}

	/**
	 *
	 * No Content
	 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/204}
	 * status code: 204
	 * body: undefined
	 */
	noContent(): HttpType.NoContentStatus {
		return {
			status: "NO_CONTENT",
			statusCode: 204,
			body: undefined,
		};
	}

	/**
	 * Bad Request
	 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400}
	 * status code: 400
	 * body: string | object | undefined | null
	 */
	badRequest(body?: string | object): HttpType.BadRequestStatus {
		return {
			status: "BAD_REQUEST",
			statusCode: 400,
			body,
		};
	}

	/**
	 * Unauthorized
	 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401}
	 * status code: 401
	 * body: string | undefined | object
	 */
	unauthorized(body?: string | object): HttpType.UnauthorizedStatus {
		return {
			status: "UNAUTHORIZED",
			statusCode: 401,
			body,
		};
	}

	/**
	 * Forbidden
	 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403}
	 * status code: 403
	 * body: string | undefined | object
	 */
	forbidden(body?: string | object): HttpType.ForbiddenStatus {
		return {
			status: "FORBIDDEN",
			statusCode: 403,
			body,
		};
	}

	/**
	 * Method Not Allowed
	 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405}
	 * status code: 405
	 * body: string | undefined | null
	 */
	methodNotAllowed(body?: string | object): HttpType.MethodNotAllowedStatus {
		return {
			status: "METHOD_NOT_ALLOWED",
			statusCode: 405,
			body,
		};
	}

	/**
	 * Internal Server Error
	 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500}
	 * status code: 500
	 * body: string | undefined | object
	 */
	internalServerError(
		body?: string | object,
	): HttpType.InternalServerErrorStatus {
		return {
			status: "INTERNAL_SERVER_ERROR",
			statusCode: 500,
			body,
		};
	}

	/**
	 * Not Implemented
	 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/501}
	 * status code: 501
	 */
	notImplemented(): HttpType.NotImplementedStatus {
		return {
			status: "NOT_IMPLEMENTED",
			statusCode: 501,
			body: "not implemented",
		};
	}
}

export type ControllerResultType<T> =
	| HttpType.OkStatus<T>
	| HttpType.CreatedStatus<T>
	| HttpType.AcceptedStatus
	| HttpType.NoContentStatus
	| HttpType.BadRequestStatus
	| HttpType.UnauthorizedStatus
	| HttpType.ForbiddenStatus
	| HttpType.MethodNotAllowedStatus
	| HttpType.InternalServerErrorStatus
	| HttpType.NotImplementedStatus;
