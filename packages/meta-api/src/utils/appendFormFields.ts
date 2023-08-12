import type FormData from 'form-data';

const appendFormFields = (
  form: FormData,
  body: Record<string, string | null | undefined>
): FormData => {
  for (const [field, value] of Object.entries(body)) {
    if (value) form.append(field, value);
  }
  return form;
};

export default appendFormFields;
