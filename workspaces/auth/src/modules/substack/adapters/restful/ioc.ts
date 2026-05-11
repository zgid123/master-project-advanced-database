import type { TDrizzle } from '#/infrastructure/drizzle/config';

import { ApproveSubstackCommand } from '../../application/admin/v1/commands';
import {
  CreateSubstackCommand,
  SubscribeSubstackCommand,
  UnsubscribeSubstackCommand,
} from '../../application/portal/v1/commands';
import {
  GetSubstackQuery,
  GetSubstacksQuery,
  GetTotalSubstacksQuery,
} from '../../application/portal/v1/queries';
import {
  SubstackRepository,
  SubstackRoleAssignmentRepository,
  SubstackRoleRepository,
  SubstackSubscriptionRepository,
} from '../../infrastructure/drizzle/repositories';

export interface ISubstackIoC {
  admin: {
    approveSubstackCommand: ApproveSubstackCommand;
  };
  portal: {
    getSubstackQuery: GetSubstackQuery;
    getSubstacksQuery: GetSubstacksQuery;
    createSubstackCommand: CreateSubstackCommand;
    getTotalSubstacksQuery: GetTotalSubstacksQuery;
    subscribeSubstackCommand: SubscribeSubstackCommand;
    unsubscribeSubstackCommand: UnsubscribeSubstackCommand;
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
  const substackSubscriptionRepository = new SubstackSubscriptionRepository(
    drizzle,
  );

  const createSubstackCommand = new CreateSubstackCommand(
    substackRepository,
    substackRoleRepository,
    substackRoleAssignmentRepository,
  );
  const getSubstackQuery = new GetSubstackQuery(substackRepository);
  const getSubstacksQuery = new GetSubstacksQuery(substackRepository);
  const getTotalSubstacksQuery = new GetTotalSubstacksQuery(substackRepository);
  const approveSubstackCommand = new ApproveSubstackCommand(substackRepository);
  const subscribeSubstackCommand = new SubscribeSubstackCommand(
    substackRepository,
    substackSubscriptionRepository,
  );
  const unsubscribeSubstackCommand = new UnsubscribeSubstackCommand(
    substackRepository,
    substackSubscriptionRepository,
  );

  return {
    admin: {
      approveSubstackCommand,
    },
    portal: {
      getSubstackQuery,
      getSubstacksQuery,
      createSubstackCommand,
      getTotalSubstacksQuery,
      subscribeSubstackCommand,
      unsubscribeSubstackCommand,
    },
  };
}
