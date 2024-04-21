import { SyntheticEvent, useContext } from "react";
import { Button, Modal, Text, View, useToast } from "reshaped";
import { AddressView } from "./AddressView";
import { Address } from "viem";
import { Field, Form, Formik } from "formik";
import { GenericField } from "./GenericField";
import { yupAddress } from "../utils/validators";
import { number, object } from "yup";
import { useOutletContext } from "react-router-dom";
import { SafeContext } from "./Contexts";
import { ProposalContext } from "../app/NewSafeProposal";
import { useUpdateProposalViaQuery } from "../hooks/useUpdateProposalViaQuery";

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
  const { safeInformation } = useOutletContext<SafeContext>();
  const toast = useToast();
  const updateProposalQuery = useUpdateProposalViaQuery();
  const currentProposal = useContext(ProposalContext);

  return (
    <Formik
      initialValues={{ address: "0x", threshold: safeInformation?.threshold }}
      validationSchema={object({ address: yupAddress, threshold: number() })}
      onSubmit={async ({ address, threshold }) => {
        if (!safeInformation) {
          return;
        }

        try {
          const addOwnerTx = await safeInformation.safeSdk.createAddOwnerTx({
            ownerAddress: address,
            threshold: threshold,
          });
          updateProposalQuery({
            data: addOwnerTx.data.data,
            value: "0",
            to: safeInformation.address,
          });
        } catch (err: any) {
          toast.show({ title: "Error Updating Safe", text: err.toString() });
        }
        onClose();
      }}
    >
      <Form>
        <Text variant="featured-2">Add Signer</Text>
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
  const { safeInformation } = useOutletContext<SafeContext>();
  const updateProposalViaQuery = useUpdateProposalViaQuery();
  const toaster = useToast();

  const onSubmitClick = async ({ threshold }: any) => {
    try {
      const removeOwnerTx = await safeInformation?.safeSdk2.createRemoveOwnerTx(
        {
          ownerAddress: target,
          threshold: threshold,
        },
      );
      if (!removeOwnerTx || !safeInformation) {
        return;
      }

      updateProposalViaQuery({
        data: removeOwnerTx.data.data,
        value: "0",
        to: safeInformation.address,
      });
      onClose();
    } catch (err: any) {
      toaster.show({
        title: "Error Removing Owner",
        text: `Error setting up transaction: ${err.toString()}`,
      });
    }
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
