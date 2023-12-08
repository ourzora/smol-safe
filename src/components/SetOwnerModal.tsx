import { SyntheticEvent, useContext } from "react";
import { Button, Modal, Text, View } from "reshaped";
import { AddressView } from "./AddressView";
import { Address } from "viem";
import { Field, Form, Formik } from "formik";
import { GenericField } from "./GenericField";
import { yupAddress } from "../utils/validators";
import { number, object } from "yup";
import { useSearchParams } from "react-router-dom";
import { SafeDataProvider } from "../app/ViewSafe";
import { SafeInformationContext } from "../app/SafeInformation";

export type OwnerAction =
  | undefined
  | {
      type: "add";
    }
  | {
      type: "remove";
      address: string;
    };

const ButtonPanel = ({
  onClick,
  actionDisabled,
  onClose,
}: {
  onClose: () => void;
  onClick?: (button: SyntheticEvent) => void;
  actionDisabled?: boolean;
}) => (
  <View paddingTop={4} direction="row" justify="space-between">
    <View.Item>
      <Button onClick={onClick} type="submit" disabled={actionDisabled}>
        Ok
      </Button>
    </View.Item>
    <View.Item>
      <Button onClick={onClose}>Cancel</Button>
    </View.Item>
  </View>
);

const AddOwnerModalContent = ({ onClose }: { onClose: () => void }) => {
  const safeInformation = useContext(SafeInformationContext);
  const [_, setSearchParams] = useSearchParams();
  const safeData = useContext(SafeDataProvider);
  return (
    <Formik
      initialValues={{ address: "0x", threshold: safeInformation?.threshold }}
      validationSchema={object({ address: yupAddress, threshold: number() })}
      onSubmit={async ({ address, threshold }) => {
        console.log("submit!!!");
        if (!safeData || !safeInformation) {
          return;
        }

        const addOwnerTx = await safeData.safeSdk.createAddOwnerTx({
          ownerAddress: address,
          threshold: threshold,
        });
        setSearchParams({
          proposal: JSON.stringify({
            actions: [
              {
                data: addOwnerTx.data.data,
                value: 0,
                to: safeInformation.address,
              },
            ],
          }),
        });
        onClose();
      }}
    >
      <Form>
        <Text variant="featured-2">Add Owner</Text>
        <Field name="address">
          {GenericField({ label: "New User Address" })}
        </Field>
        <Text>
          <Field name="threshold">
            {GenericField({
              label: "Threshold",
              fieldProps: { type: "number" },
            })}
          </Field>
        </Text>

        <ButtonPanel onClose={onClose} />
      </Form>
    </Formik>
  );
};

const RemoveOwnerModalContent = ({
  onClose,
  target,
}: {
  onClose: () => void;
  target: string;
}) => {
  const [_, setParams] = useSearchParams();
  const safeData = useContext(SafeDataProvider);
  const safeInformation = useContext(SafeInformationContext);

  const onSubmitClick = async ({ threshold }: any) => {
    const removeOwnerTx = await safeData?.safeSdk.createRemoveOwnerTx({
      ownerAddress: safeInformation!.address,
      threshold: threshold,
    });
    if (!removeOwnerTx || !safeInformation) {
      return;
    }
    setParams({
      proposal: JSON.stringify({
        actions: [
          { data: removeOwnerTx.data, value: "0", to: safeInformation.address },
        ],
      }),
    });
    onClose();
  };
  return (
    <Formik
      validationSchema={object({ threshold: number() })}
      initialValues={{ threshold: safeInformation?.threshold }}
      onSubmit={onSubmitClick}
    >
      <Form>
        <Text variant="featured-2">Remove Owner</Text>
        <Text>
          Owner: <AddressView address={target as Address} />
        </Text>
        <Text>
          <Field name="threshold">
            {GenericField({
              label: "Threshold",
              fieldProps: { type: "number" },
            })}
          </Field>
        </Text>

        <ButtonPanel onClose={onClose} />
      </Form>
    </Formik>
  );
};

export const SetOwnerModal = ({
  action,
  onClose,
}: {
  action: OwnerAction;
  onClose: () => void;
}) => {
  return (
    <Modal active={!!action} onClose={onClose}>
      {action?.type === "remove" && (
        <RemoveOwnerModalContent onClose={onClose} target={action.address} />
      )}
      {action?.type === "add" && <AddOwnerModalContent onClose={onClose} />}
    </Modal>
  );
};
