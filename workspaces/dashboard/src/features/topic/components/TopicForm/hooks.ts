import {
  createFormHook,
  createFormHookContexts,
  formOptions,
} from '@tanstack/react-form';
import { type } from 'arktype';

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export const TopicSchema = type({
  title: 'string > 0',
  body: 'string',
  substackId: 'string',
});

export type TTopicFormValues = typeof TopicSchema.infer;

const defaultValues: TTopicFormValues = {
  title: '',
  body: '',
  substackId: '',
};

export const topicFormOptions = formOptions({
  defaultValues: defaultValues,
  validators: {
    onDynamic: TopicSchema,
  },
});

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  formContext,
  fieldContext,
  formComponents: {},
  fieldComponents: {},
});
