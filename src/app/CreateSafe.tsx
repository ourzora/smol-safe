import { useCallback, useContext } from "react";
import { CurrentNetwork, WalletProviderContext } from "./Root";
import { Field, FieldArray, Formik } from "formik";
import { Text, Button, FormControl, TextField, View, useToast } from "reshaped";
import { allowedNetworks, contractNetworks } from "../chains";
import { isAddress } from "viem";
import { ethers } from "ethers";
import { EthersAdapter, SafeFactory } from "@safe-global/protocol-kit";
import { useNavigate } from "react-router-dom";

function validateAddress(value: string) {
  if (!isAddress(value)) {
    return "Invalid address";
  }
}

function validateSafeArguments(values: any) {
  const errors: any = {};

  if (values.threshold <= 0) {
    errors.threshold = "Threshold needs to be at least 1";
  }
  if (values.threshold > values.addresses.length) {
    errors.threshold = "Threshold cannot be more than the number of addresses";
  }

  return errors;
}

function wait(tm: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, tm);
  });
}

export function CreateSafe() {
  const provider = useContext(WalletProviderContext);
  const network = useContext(CurrentNetwork);
  const toaster = useToast();
  const navigate = useNavigate();

  const submitCallback = useCallback(
    async (data: any) => {
      try {
        const ethAdapter = new EthersAdapter({
          ethers,
          signerOrProvider: provider!.getSigner(),
        });
        const adapter = await SafeFactory.create({
          ethAdapter,
          contractNetworks,
        });
        const sdk = await adapter.deploySafe({
          safeAccountConfig: {
            owners: data.addresses,
            threshold: parseInt(data.threshold, 10),
          },
        });
        const newAddress = await sdk.getAddress();
        toaster.show({
          title: "Created a new safe!",
          text: `Opening safe... The new safe address is ${newAddress}`,
        });
        navigate(`/safe/${network}/${newAddress}`);
      } catch (e: any) {
        toaster.show({
          title: "Error creating safe",
          text: `Message: ${e.message}`,
        });
      }
    },
    [provider]
  );

  return (
    <View gap={4} paddingTop={10}>
      <Text variant="title-3">Create a new safe</Text>
      <Text variant="body-1">
        Network: {allowedNetworks[network]?.name || "unknown"}
      </Text>
      <Formik
        onSubmit={submitCallback}
        initialValues={{
          threshold: 1,
          addresses: [provider!.getSigner()._address || "0x"],
        }}
        validate={validateSafeArguments}
      >
        {({ handleSubmit, handleChange, isSubmitting, values, errors }) => (
          <form onSubmit={handleSubmit}>
            <FieldArray
              name="addresses"
              render={(arrayHelpers) => (
                <>
                  {values.addresses.map((address, indx) => (
                    <View gap={2} paddingTop={4} key={`${address}-${indx}`}>
                      <Field
                        validate={validateAddress}
                        name={`addresses.${indx}`}
                      >
                        {({ field: { name, value } }: any) => (
                          <FormControl
                            key={indx}
                            hasError={
                              !!(errors.addresses && errors.addresses[indx])
                            }
                          >
                            <FormControl.Label>
                              Signer address {indx + 1}:{" "}
                            </FormControl.Label>
                            <TextField
                              name={name}
                              value={value}
                              onChange={({ event }: any) => handleChange(event)}
                              endSlot={
                                <Button
                                  color="critical"
                                  size="small"
                                  onClick={() => arrayHelpers.remove(indx)}
                                >
                                  Remove
                                </Button>
                              }
                            />
                            {errors.addresses && errors.addresses[indx] && (
                              <FormControl.Error>
                                {errors.addresses[indx]}
                              </FormControl.Error>
                            )}
                          </FormControl>
                        )}
                      </Field>
                    </View>
                  ))}
                  <View paddingTop={4} paddingBottom={4}>
                    <View>
                      <Button onClick={() => arrayHelpers.push("")}>Add</Button>
                    </View>
                  </View>
                </>
              )}
            />
            <FormControl hasError={!!errors.threshold}>
              <FormControl.Label>Threshold:</FormControl.Label>
              <TextField
                inputAttributes={{ type: "number" }}
                name="threshold"
                value={values.threshold.toString()}
                onChange={({ event }: any) => handleChange(event)}
              />
              {errors.threshold && (
                <FormControl.Error>{errors.threshold}</FormControl.Error>
              )}
              <FormControl.Helper>
                This number of signers needs to approve
              </FormControl.Helper>
            </FormControl>
            <View paddingTop={4}>
              <Button
                type="submit"
                attributes={{
                  title:
                    Object.keys(errors).length > 0
                      ? "Please fix all form errors"
                      : "Create a new safe",
                }}
                disabled={Object.keys(errors).length > 0 || isSubmitting}
              >
                {isSubmitting ? "Creating safe..." : "Create Safe"}
              </Button>
            </View>
          </form>
        )}
      </Formik>
    </View>
  );
}
