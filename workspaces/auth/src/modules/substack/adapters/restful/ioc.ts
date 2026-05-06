import type { TDrizzle } from '#/infrastructure/drizzle/config';

import { CreateSubstackCommand } from '../../application/portal/v1/commands';
import {
  GetSubstackQuery,
  GetSubstacksQuery,
} from '../../application/portal/v1/queries';
import {
  SubstackRepository,
  SubstackRoleAssignmentRepository,
  SubstackRoleRepository,
} from '../../infrastructure/drizzle/repositories';

export interface ISubstackIoC {
  portal: {
    getSubstackQuery: GetSubstackQuery;
    getSubstacksQuery: GetSubstacksQuery;
    createSubstackCommand: CreateSubstackCommand;
  };
}

interface IRegisterIoCParams {
  drizzle: TDrizzle;
}

export function registerSubstackIoC({
  drizzle,
}: IRegisterIoCParams): ISubstackIoC {
  const substackRepository = new SubstackRepository(drizzle);
  const substackRoleRepository = new SubstackRoleRepository(drizzle);
  const substackRoleAssignmentRepository = new SubstackRoleAssignmentRepository(
    drizzle,
  );

  const createSubstackCommand = new CreateSubstackCommand(
    substackRepository,
    substackRoleRepository,
    substackRoleAssignmentRepository,
  );
  const getSubstackQuery = new GetSubstackQuery(substackRepository);
  const getSubstacksQuery = new GetSubstacksQuery(substackRepository);

  return {
    portal: {
      getSubstackQuery,
      getSubstacksQuery,
      createSubstackCommand,
    },
  };
}
