'use client';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Button } from '@/app/_common/components/button';
import { Card } from '@/app/_common/components/card';
import { Input } from '@/app/_common/components/input';
import MultiSelect from '@/app/_common/components/Multiselect';
import { Switch } from '@/app/_common/components/switch';
import { Textarea } from '@/app/_common/components/textarea';
import { useTranslationContext } from '@/app/_common/contexts/Translation';

type TypeSelectArgs<T extends { label: string; value: string }[]> = {
  options: T;
  value: T[number]['value'];
};

type TypeMultiselectArgs<T extends { label: string; value: string }[]> = {
  options: T;
  value: T[number]['value'][];
};

export type TypeArgs = {
  [name: string]: {
    label: string;
    description?: string;
    required?: boolean;
  } & (
    | { type: 'text'; value: string; forbiddenValues?: string[] }
    | { type: 'textarea'; value: string; forbiddenValues?: string[] }
    | { type: 'email'; value: string; forbiddenValues?: string[] }
    | { type: 'password'; value: string; forbiddenValues?: string[] }
    | { type: 'time'; value: string }
    | { type: 'number'; value: number }
    | { type: 'switch'; value: boolean }
    | ({ type: 'select' } & TypeSelectArgs<{ label: string; value: string }[]>)
    | ({ type: 'multiselect' } & TypeMultiselectArgs<{ label: string; value: string }[]>)
  );
};

export type TypeResponse<T extends TypeArgs> = {
  [K in keyof T]: T[K]['type'] extends 'text' | 'textarea' | 'email' | 'password' | 'time' | 'select' | 'multiselect'
    ? T[K]['value']
    : T[K]['type'] extends 'number'
      ? number
      : T[K]['type'] extends 'switch'
        ? boolean
        : never;
};

type TypeField = {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
} & (
  | { type: 'text'; value: string; forbiddenValues: string[] }
  | { type: 'textarea'; value: string; forbiddenValues: string[] }
  | { type: 'email'; value: string; forbiddenValues: string[] }
  | { type: 'password'; value: string; forbiddenValues: string[] }
  | { type: 'time'; value: string }
  | { type: 'number'; value: number }
  | { type: 'switch'; value: boolean }
  | {
      type: 'select';
      value: string;
      options: { label: string; value: string }[];
    }
  | {
      type: 'multiselect';
      value: string[];
      options: { label: string; value: string }[];
    }
);

const transformArgsToFields = (args: TypeArgs): TypeField[] => {
  return Object.entries(args).map(([name, arg]) => {
    switch (arg.type) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'password':
        return {
          description: arg.description,
          forbiddenValues: arg.forbiddenValues || [],
          label: arg.label,
          name,
          required: arg.required,
          type: arg.type,
          value: arg.value,
        };
      case 'time':
        return {
          description: arg.description,
          label: arg.label,
          name,
          required: arg.required,
          type: arg.type,
          value: arg.value,
        };
      case 'number':
        return {
          description: arg.description,
          label: arg.label,
          name,
          required: arg.required,
          type: 'number',
          value: arg.value,
        };
      case 'switch':
        return {
          description: arg.description,
          label: arg.label,
          name,
          required: arg.required,
          type: 'switch',
          value: arg.value,
        };
      case 'select':
        return {
          description: arg.description,
          label: arg.label,
          name,
          options: arg.options,
          required: arg.required,
          type: 'select',
          value: arg.value,
        };
      case 'multiselect':
        return {
          description: arg.description,
          label: arg.label,
          name,
          options: arg.options,
          required: arg.required,
          type: 'multiselect',
          value: arg.value,
        };
    }
    throw new Error(`Unsupported field type`);
  });
};

const transformFieldsToResponse = <T extends TypeArgs>(
  fields: {
    [K in keyof T]: TypeField & { name: K };
  }[keyof T][],
): TypeResponse<T> => {
  const result = {} as TypeResponse<T>;

  for (const field of fields) {
    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'password':
      case 'time':
      case 'number':
      case 'switch':
      case 'select':
      case 'multiselect':
        result[field.name] = field.value as TypeResponse<T>[typeof field.name];
        break;
    }
  }

  return result;
};

export const DynamicForm = ({ args: initialArgs, resolver }: { args: TypeArgs; resolver: (arg: unknown) => void }) => {
  const { translation } = useTranslationContext();
  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<{ items: TypeField[] }>({
    defaultValues: { items: transformArgsToFields(initialArgs) },
  });

  const { fields, replace } = useFieldArray({
    control,
    name: 'items',
  });

  const onCancel = () => {
    resolver(null);
    replace([]);
  };

  const onSubmit = (result: { items: TypeField[] }) => {
    resolver(transformFieldsToResponse(result.items));
    replace([]);
  };

  return (
    <>
      <div className="px-8 pb-6 overflow-y-auto min-w-3xl">
        {fields.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">{translation.common.noFields}</div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="p-4 bg-card border border-gray-200">
                <div className="flex flex-row items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground w-1/3">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </span>
                  <div className="w-2/3">
                    {field.type === 'text' && (
                      <Input
                        type="text"
                        className="border p-1 bg-gray-200"
                        {...register(`items.${index}.value`, {
                          required: field.required && translation.common.requiredField,
                          validate: (value) => !field.forbiddenValues.includes(String(value)) || translation.common.forbiddenValue,
                        })}
                        defaultValue={field.value}
                      />
                    )}

                    {field.type === 'textarea' && (
                      <Textarea
                        className="border p-1 bg-gray-200"
                        {...register(`items.${index}.value`, {
                          validate: (value) => !field.forbiddenValues.includes(String(value)) || translation.common.forbiddenValue,
                        })}
                        defaultValue={field.value}
                      />
                    )}

                    {field.type === 'email' && (
                      <Input
                        type="email"
                        className="border p-1 bg-gray-200"
                        {...register(`items.${index}.value`, {
                          pattern: {
                            message: translation.common.invalidEmail,
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          },
                          required: field.required && translation.common.requiredField,
                          validate: (value) => !field.forbiddenValues.includes(String(value)) || translation.common.forbiddenValue,
                        })}
                        defaultValue={field.value}
                      />
                    )}

                    {field.type === 'password' && (
                      <Input
                        type="password"
                        className="border p-1 bg-gray-200"
                        {...register(`items.${index}.value`, {
                          required: field.required && translation.common.requiredField,
                          validate: (value) => !field.forbiddenValues.includes(String(value)) || translation.common.forbiddenValue,
                        })}
                        defaultValue={field.value}
                      />
                    )}

                    {field.type === 'time' && (
                      <Input
                        type="time"
                        className="border p-1 bg-gray-200"
                        {...register(`items.${index}.value`, {
                          required: field.required && translation.common.requiredField,
                          validate: (value) => {
                            return /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(value));
                          },
                        })}
                        defaultValue={field.value}
                      />
                    )}

                    {field.type === 'number' && (
                      <Input
                        type="number"
                        className="border p-1"
                        {...register(`items.${index}.value`, {
                          required: field.required && translation.common.requiredField,
                        })}
                        defaultValue={field.value}
                      />
                    )}

                    {field.type === 'switch' && (
                      <div className="flex items-center gap-3">
                        <Switch
                          id={field.id}
                          defaultChecked={field.value}
                          {...register(`items.${index}.value`, {
                            required: field.required && translation.common.requiredField,
                          })}
                        />
                      </div>
                    )}

                    {field.type === 'select' && (
                      <select
                        className="border p-2 rounded bg-gray-200 w-full"
                        {...register(`items.${index}.value`, {
                          required: field.required && translation.common.requiredField,
                        })}
                        defaultValue={field.value}
                      >
                        <option value="">{translation.common.selectOption}</option>
                        {field.options.map((opt, i) => (
                          <option key={i} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.type === 'multiselect' && (
                      <Controller
                        control={control}
                        name={`items.${index}.value`}
                        defaultValue={field.value}
                        rules={{
                          required: field.required && translation.common.requiredField,
                        }}
                        render={({ field: controllerField }) => (
                          <MultiSelect value={controllerField.value as typeof field.value} onChange={controllerField.onChange} options={field.options} />
                        )}
                      />
                    )}

                    {errors.items?.[index]?.value && <p className="text-red-600 text-sm mt-1">{errors.items[index].value.message}</p>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      <div className="px-8 pb-6 flex justify-end gap-4">
        <Button onClick={onCancel} variant="destructive">
          {translation.common.cancel}
        </Button>
        <Button onClick={handleSubmit(onSubmit)} variant="default">
          {translation.common.accept}
        </Button>
      </div>
    </>
  );
};
