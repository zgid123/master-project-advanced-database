import type { TDrizzle } from '#/infrastructure/drizzle/config';

import { ApproveSubstackCommand } from '../../application/admin/v1/commands';
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
  admin: {
    approveSubstackCommand: ApproveSubstackCommand;
  };
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
  const approveSubstackCommand = new ApproveSubstackCommand(substackRepository);

  return {
    admin: {
      approveSubstackCommand,
    },
    portal: {
      getSubstackQuery,
      getSubstacksQuery,
      createSubstackCommand,
    },
  };
}
