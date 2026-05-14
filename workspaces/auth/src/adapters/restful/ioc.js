import { registerAuthIoC, } from '#/modules/auth/adapters/restful/ioc';
import { registerSubstackIoC, } from '#/modules/substack/adapters/restful/ioc';
export function registerIoC({ drizzle }) {
    return {
        drizzle,
        auth: registerAuthIoC({
            drizzle,
        }),
        substack: registerSubstackIoC({
            drizzle,
        }),
    };
}
