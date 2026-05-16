import {
  createFormHook,
  createFormHookContexts,
  formOptions,
} from '@tanstack/react-form';
import { type } from 'arktype';

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export const CommentSchema = type({
  content: 'string > 0',
});

export type TCommentFormValues = typeof CommentSchema.infer;

const defaultValues: TCommentFormValues = {
  content: '',
};

export const commentFormOptions = formOptions({
  defaultValues: defaultValues,
  validators: {
    onDynamic: CommentSchema,
  },
});

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  formContext,
  fieldContext,
  formComponents: {},
  fieldComponents: {},
});
