import {APIGatewayProxyResultV2} from "aws-lambda";

/**
 * Api Gateway responses
 */
export class LambdaApiGatewayResponse {
    /**
     * OK
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200}
     * status code: 200
     * body: serialized json string. it can be null.
     *
     * You can set an object in the argument. IF so, the object is serialized.
     * @param body
     */
    static ok(body?: string | object | null): APIGatewayProxyResultV2 {
        return {
            statusCode: 200,
            body: body
                ? typeof body === "string" ? body : JSON.stringify(body)
                : undefined
        }
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
    static created(body?: string | object | null): APIGatewayProxyResultV2 {
        return {
            statusCode: 201,
            body: body
                ? typeof body === "string" ? body : JSON.stringify(body)
                : undefined
        }
    }


     /**
     * Updated
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/202}
     * status code: 202
     */
    static accepted(): APIGatewayProxyResultV2 {
        return {
            statusCode: 202,
        }
    }

    /**
     * Bad Request
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400}
     * status code: 400
     * body: string | object | undefined | null
     */
    static badRequest(body?: string | object | null): APIGatewayProxyResultV2 {

        return {
            statusCode: 400,
            body: body
                ? typeof body === "string" ?  body : JSON.stringify(body)
                : undefined

        }
    }

    /**
     * Unauthorized
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401}
     * status code: 401
     */
    static Unauthorized(): APIGatewayProxyResultV2 {
        return {
            statusCode: 401
        }
    }

    /**
     * Forbidden
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403}
     * status code: 403
     */
    static Forbidden(): APIGatewayProxyResultV2 {
        return {
            statusCode: 403
        }
    }

    /**
     * Not Found
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404}
     * status code: 404
     */
    static NotFound(): APIGatewayProxyResultV2 {
        return {
            statusCode: 404
        }
    }

    /**
     * Method Not Allowed
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/405}
     * status code: 405
     */
    static MethodNotAllowed(): APIGatewayProxyResultV2 {
        return {
            statusCode: 405
        }
    }

    /**
     * Internal Server Error
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500}
     * status code: 500
     */
    static InternalServerError(): APIGatewayProxyResultV2 {
        return {
            statusCode: 500
        }
    }

    /**
     * Not Implemented
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/501}
     * status code: 500
     */
    static NotImplemented(): APIGatewayProxyResultV2 {
        return {
            statusCode: 501
        }
    }
}