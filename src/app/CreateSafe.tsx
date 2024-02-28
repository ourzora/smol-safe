import { useCallback, useEffect, useState } from "react";
import { Field, FieldArray, Formik } from "formik";
import { Text, Button, FormControl, TextField, View, useToast } from "reshaped";
import { allowedNetworks, contractNetworks } from "../chains";
import { isAddress } from "viem";
import { ethers } from "ethers";
import { EthersAdapter, SafeFactory } from "@safe-global/protocol-kit";
import { useNavigate, useOutletContext } from "react-router-dom";
import { AbstractSigner } from "ethers";
import { BrowserProvider } from "ethers";
import { NetworkContext } from "../components/Contexts";

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

export function CreateSafe() {
  const { walletProvider: provider } = useOutletContext<NetworkContext>();
  const { currentNetwork: network } = useOutletContext<NetworkContext>();
  const toaster = useToast();
  const navigate = useNavigate();
  const [signerInfo, setSignerInfo] = useState<
    undefined | { signer: AbstractSigner; address: string }
  >(undefined);

  const updateSignerInfo = useCallback(
    async (provider: BrowserProvider) => {
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setSignerInfo({ signer, address });
    },
    [setSignerInfo],
  );

  useEffect(() => {
    if (provider) {
      updateSignerInfo(provider);
    }
  }, [provider, updateSignerInfo]);

  const submitCallback = useCallback(
    async (data: any) => {
      if (!signerInfo) {
        return;
      }
      try {
        const ethAdapter = new EthersAdapter({
          ethers,
          signerOrProvider: signerInfo.signer,
        });
        const adapter = await SafeFactory.create({
          ethAdapter: ethAdapter,
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
    [navigate, network, signerInfo, toaster],
  );

  return (
    <View gap={4} paddingTop={10}>
      <Text variant="title-3">Create a new safe</Text>
      <Text variant="body-1">
        Network: {allowedNetworks[Number(network)]?.name || "unknown"}
      </Text>
      <Formik
        onSubmit={submitCallback}
        initialValues={{
          threshold: 1,
          addresses: [signerInfo?.address || "0x"],
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
                                {errors.addresses[indx].toString()}
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
