import type FormData from 'form-data';

const appendFormFields = (
  form: FormData,
  body: { [key: string]: string | null | undefined }
): FormData => {
  const fields = Object.keys(body);

  for (let k = 0; k < fields.length; k += 1) {
    const field = fields[k];
    const value = body[field];

    if (value) form.append(field, value);
  }

  return form;
};

export default appendFormFields;
