import { NewSubstack, type TNewSubstack } from '@domain/auth';
import {
  createFormHook,
  createFormHookContexts,
  formOptions,
} from '@tanstack/react-form';

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

const defaultValues: TNewSubstack = {
  name: '',
  description: '',
};

export const substackFormOptions = formOptions({
  defaultValues: defaultValues,
  validators: {
    onDynamic: NewSubstack,
  },
});

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  formContext,
  fieldContext,
  formComponents: {},
  fieldComponents: {},
});
