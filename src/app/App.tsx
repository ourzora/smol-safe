import { useContext, useEffect, useState } from "react";
import {
  FormControl,
  Button,
  TextField,
  Select,
  Divider,
  View,
  Card,
} from "reshaped";
import { allowedNetworks } from "../chains";
import { useFormik } from "formik";
import { isAddress } from "viem";
import { CurrentNetwork, WalletProviderContext } from "./Root";
import { useNavigate } from "react-router-dom";

// type AddressInputs = {
//   address: string;
// };

// function transformFieldChange(props: any) {
//   return {
//     ...props,
//     onChange: ({ event }: any) => props.onChange(event),
//   };
// }

function FormAddressInput() {
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
      alert(JSON.stringify(values, null, 2));
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
  const walletProviderContext = useContext(WalletProviderContext);
  const currentNetwork = useContext(CurrentNetwork);
  const navigate = useNavigate();

  const changeNetwork = ({ value }: { value: string }) => {
    walletProviderContext?.send("wallet_switchEthereumChain", [
      {
        chainId: `0x${parseInt(value).toString(16)}`,
      },
    ]);

    currentNetwork.chainId = parseInt(value);
  };

  return (
    <View padding={10} justify="space-between" gap={6} direction="column">
      <Card>
        <View paddingBottom={4} gap={4}>
          <FormControl>
            <FormControl.Label>Network:</FormControl.Label>
            <Select
              name="network"
              value={currentNetwork.chainId.toString()}
              onChange={changeNetwork}
              options={Object.values(allowedNetworks)
                .filter((d) => !!d)
                .map((allowedNetwork) => ({
                  value: allowedNetwork.id.toString(),
                  label: allowedNetwork.name,
                }))}
            ></Select>
          </FormControl>
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
