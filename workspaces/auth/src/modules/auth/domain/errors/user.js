import { pascalize } from '@alphacifer/core-utils/stringUtils';
import { HonoError } from '@alphacifer/hono/core';
import { CANNOT_CREATE_USER_CODE, CANNOT_CREATE_USER_NAME, USER_ALREADY_EXISTS_CODE, USER_ALREADY_EXISTS_NAME, USER_INVALID_PARAMS_CODE, USER_INVALID_PARAMS_NAME, USER_NOT_FOUND_CODE, USER_NOT_FOUND_NAME, } from '@domain/auth';
export class UserError extends HonoError {
    static cannotCreate() {
        return new UserError({
            status: 500,
            code: CANNOT_CREATE_USER_CODE,
            name: CANNOT_CREATE_USER_NAME,
            message: 'Cannot create user',
        });
    }
    static alreadyExists(attribute) {
        return new UserError({
            status: 409,
            code: USER_ALREADY_EXISTS_CODE,
            name: USER_ALREADY_EXISTS_NAME,
            message: `${pascalize(attribute)} already exists`,
        });
    }
    static invalidParams(attibute) {
        return new UserError({
            status: 422,
            code: USER_INVALID_PARAMS_CODE,
            name: USER_INVALID_PARAMS_NAME,
            message: `Invalid params: ${pascalize(attibute)}`,
        });
    }
    static notFound() {
        return new UserError({
            status: 404,
            code: USER_NOT_FOUND_CODE,
            name: USER_NOT_FOUND_NAME,
            message: 'User not found',
        });
    }
}
