import { FormControl, Button, TextField, Divider, View, Card } from "reshaped";
import { useFormik } from "formik";
import { isAddress } from "viem";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { CurrentNetwork } from "./Root";

function FormAddressInput() {
  const navigate = useNavigate();

  const network = useContext(CurrentNetwork);

  const formik = useFormik({
    initialValues: {
      address: "",
    },
    validate: (data) => {
      const errors = {};
      if (!isAddress(data.address)) {
        return { address: "Invalid Address" };
      }
      return errors;
    },
    onSubmit: (values) => {
      navigate(`/safe/${network}/${values.address}`);
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <FormControl hasError={!formik.isValid}>
        <FormControl.Label>Safe Address:</FormControl.Label>
        <TextField
          value={formik.values.address}
          onChange={({ event }: any) => formik.handleChange(event)}
          onBlur={formik.handleBlur}
          name="address"
        />
        {formik.errors.address && (
          <FormControl.Error>{formik.errors.address}</FormControl.Error>
        )}
        <FormControl.Helper>
          Remember to select the correct network
        </FormControl.Helper>
      </FormControl>
      <View>
        <Button type="submit">Connect to Safe</Button>
      </View>
    </form>
  );
}

export function App() {
  const navigate = useNavigate();

  return (
    <View padding={10} justify="space-between" gap={6} direction="column">
      <Card>
        <View paddingBottom={4} gap={4}>
          <FormAddressInput />
        </View>
        <Divider />
        <View paddingTop={4}>
          <Button
            onClick={(evt) => {
              evt.preventDefault();
              navigate("/create");
            }}
          >
            Create a New Safe
          </Button>
        </View>
      </Card>
    </View>
  );
}
