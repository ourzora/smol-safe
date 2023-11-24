import { FormControl, TextField, View } from "reshaped";
import { get } from "../utils/get";

export const GenericField = ({
  label,
  fieldProps,
}: {
  label: string;
  fieldProps?: any;
}) => {
  return ({ field: { name, value, onChange }, form: { errors } }: any) => {
    const error = get(errors, name);
    // console.log({ error, errors, value, name });

    return (
      <View paddingTop={1} paddingBottom={1}>
        <FormControl key={name} hasError={!!error}>
          <FormControl.Label>{label}</FormControl.Label>
          <TextField
            name={name}
            value={value}
            onChange={({ event }: any) => onChange(event)}
            {...fieldProps}
          />
          {error && <FormControl.Error>{error}</FormControl.Error>}
        </FormControl>
      </View>
    );
  };
};
