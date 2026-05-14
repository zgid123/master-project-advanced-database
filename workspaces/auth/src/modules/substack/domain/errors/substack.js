import { pascalize } from '@alphacifer/core-utils/stringUtils';
import { HonoError } from '@alphacifer/hono/core';
import { CANNOT_CREATE_SUBSTACK_CODE, CANNOT_CREATE_SUBSTACK_NAME, CANNOT_UPDATE_SUBSTACK_CODE, CANNOT_UPDATE_SUBSTACK_NAME, SUBSTACK_ALREADY_EXISTS_CODE, SUBSTACK_ALREADY_EXISTS_NAME, SUBSTACK_FORBIDDEN_CODE, SUBSTACK_FORBIDDEN_NAME, SUBSTACK_NOT_FOUND_CODE, SUBSTACK_NOT_FOUND_NAME, } from '@domain/auth';
export class SubstackError extends HonoError {
    static cannotCreate() {
        return new SubstackError({
            status: 500,
            code: CANNOT_CREATE_SUBSTACK_CODE,
            name: CANNOT_CREATE_SUBSTACK_NAME,
            message: 'Cannot create substack',
        });
    }
    static cannotUpdate() {
        return new SubstackError({
            status: 500,
            code: CANNOT_UPDATE_SUBSTACK_CODE,
            name: CANNOT_UPDATE_SUBSTACK_NAME,
            message: 'Cannot update substack',
        });
    }
    static alreadyExists(attribute) {
        return new SubstackError({
            status: 409,
            code: SUBSTACK_ALREADY_EXISTS_CODE,
            name: SUBSTACK_ALREADY_EXISTS_NAME,
            message: `${pascalize(attribute)} already exists`,
        });
    }
    static notFound() {
        return new SubstackError({
            status: 404,
            code: SUBSTACK_NOT_FOUND_CODE,
            name: SUBSTACK_NOT_FOUND_NAME,
            message: 'Substack not found',
        });
    }
    static forbidden() {
        return new SubstackError({
            status: 403,
            code: SUBSTACK_FORBIDDEN_CODE,
            name: SUBSTACK_FORBIDDEN_NAME,
            message: 'You are not authorized to modify this substack',
        });
    }
}
