import { Field, FieldArray, Formik } from "formik";
import { SafeInformation } from "./SafeInformation";
import {
  Card,
  View,
  Text,
  Button,
  useToast,
  TextArea,
  TextField,
} from "reshaped";
import {
  SyntheticEvent,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Address, Hex } from "viem";
import { validateAddress, validateETH, yupAddress } from "../utils/validators";
import { GenericField } from "../components/GenericField";
import { useSearchParams } from "react-router-dom";
import { InferType, array, number, object, string } from "yup";
import { AddressView } from "../components/AddressView";
import { DataActionPreview } from "../components/DataActionPreview";
import Safe, { EthersAdapter } from "@safe-global/protocol-kit";
import { WalletProviderContext } from "./Root";
import { ethers } from "ethers";
import { contractNetworks } from "../chains";
import { SafeDataProvider } from "./ViewSafe";

const FormActionItem = ({
  name,
  indx,
  remove,
}: {
  name: string;
  indx: number;
  remove: (indx: number) => void;
}) => {
  return (
    <View>
      <View direction="row" align="center" justify="space-between">
        <Text variant="body-2">Action #{indx} </Text>
        <Button onClick={() => remove(indx)} variant="ghost">
          Remove
        </Button>
      </View>
      <Field name={`${name}.to`} validate={validateAddress}>
        {GenericField({ label: "Destination Contract" })}
      </Field>
      <Field name={`${name}.value`} validate={validateETH}>
        {GenericField({
          label: "Value (in ETH)",
          fieldProps: { type: "number" },
        })}
      </Field>
      <Field name={`${name}.data`}>{GenericField({ label: "Data" })}</Field>
    </View>
  );
};

const proposalSchema = object({
  nonce: number().nullable(),
  actions: array(
    object({
      to: yupAddress,
      value: string()
        .default("0")
        .matches(
          /^[0-9]+(\.[0-9]+)?$/,
          "Needs to be a ETH price (0, 1, or 0.23)"
        )
        .required(),
      data: string()
        .default("0x")
        .matches(
          /^0x(?:[0-9A-Za-z][0-9A-Za-z])*$/,
          "Data is required to match hex format"
        )
        .required(),
    })
  ),
});

interface Proposal extends InferType<typeof proposalSchema> {
  // using interface instead of type generally gives nicer editor feedback
}

const DEFAULT_ACTION_ITEM = {
  to: "0x",
  value: "0",
  data: "0x",
};

const DEFAULT_PROPOSAL = {
  nonce: null,
  actions: [DEFAULT_ACTION_ITEM],
};

export const NewSafeProposal = () => {
  const [params, setParams] = useSearchParams();
  const [proposal, setProposal] = useState<undefined | Proposal>();
  const [isEditing, setIsEditing] = useState(true);

  useEffect(() => {
    if (proposal) {
      return;
    }
    const newProposal = params.get("proposal");
    if (newProposal) {
      const newProposalData = JSON.parse(newProposal);
      if (proposalSchema.validateSync(newProposalData)) {
        setProposal(newProposalData);
        setIsEditing(false);
      }
    } else {
      setProposal(DEFAULT_PROPOSAL);
    }
  }, [params, proposal, setProposal, setIsEditing]);

  const setEdit = useCallback(
    (evt: SyntheticEvent) => {
      setIsEditing(true);
      evt.preventDefault();
    },
    [setIsEditing]
  );

  const provider = useContext(WalletProviderContext);
  const toaster = useToast();
  const safeData = useContext(SafeDataProvider);

  const submitCallback = useCallback(async () => {
    try {
      const ethAdapter = new EthersAdapter({
        ethers,
        signerOrProvider: provider!.getSigner(),
      });
      const adapter = await Safe.create({
        ethAdapter,
        safeAddress: await safeData!.safeSdk.getAddress(),
        contractNetworks,
      });
      if (!proposal?.actions) {
        return;
      }
      const proposalData =
        proposal.actions.length === 1 ? proposal.actions[0] : proposal?.actions;

      const txn = await adapter.createTransaction({
        safeTransactionData: proposalData,
        options: { nonce: proposal.nonce || undefined },
      });
      const executedTxn = await adapter.executeTransaction(txn);
      await executedTxn.transactionResponse?.wait();

      toaster.show({
        title: "Approved Txn Hash",
        text: `Approved with hash: ${executedTxn.hash}`,
      });
    } catch (e: any) {
      toaster.show({
        title: "Error creating safe",
        text: `Message: ${e.message}`,
      });
    }
  }, [proposal, safeData, provider]);

  const onSubmit = useCallback((result: Proposal) => {
    setProposal(result);
    setParams({ proposal: JSON.stringify(result) });
    setIsEditing(false);
  }, []);
  const defaultActions = proposal || DEFAULT_PROPOSAL;

  return (
    <View paddingTop={4} paddingBottom={8} gap={8}>
      <SafeInformation>
        {isEditing ? (
          <Card>
            <Formik
              validationSchema={proposalSchema}
              initialValues={defaultActions}
              onSubmit={onSubmit}
            >
              {({ handleSubmit, values, isValid }) => (
                <form onSubmit={handleSubmit}>
                  <View gap={4}>
                    <View.Item>
                      <Text variant="featured-2">New Proposal Details</Text>
                    </View.Item>
                    <View.Item>
                      <Field name="nonce">
                        {GenericField({
                          label: "Nonce (optional)",
                          fieldProps: { type: "number" },
                        })}
                      </Field>
                    </View.Item>
                    <FieldArray name="actions">
                      {(actions) => (
                        <>
                          {values.actions?.map((_, indx) => (
                            <FormActionItem
                              remove={actions.remove}
                              indx={indx}
                              name={`actions.${indx}`}
                            />
                          ))}
                          <View direction="row" justify="space-between">
                            <View> </View>
                            <Button
                              onClick={actions.handlePush(DEFAULT_ACTION_ITEM)}
                            >
                              Add
                            </Button>
                          </View>
                        </>
                      )}
                    </FieldArray>
                    <View.Item>
                      <Button disabled={!isValid} type="submit">
                        Done
                      </Button>
                    </View.Item>
                  </View>
                </form>
              )}
            </Formik>
          </Card>
        ) : (
          <>
            {proposal && (
              <View>
                <View.Item>Nonce: {proposal.nonce}</View.Item>
                {proposal.actions?.map((action, indx: number) => (
                  <>
                    <View.Item>Proposal #{indx}</View.Item>
                    <View.Item>
                      To: <AddressView address={action.to as Address} />
                    </View.Item>
                    <View.Item>
                      Value:
                      <TextField name="value" value={action.value} />
                    </View.Item>
                    {action.data ? (
                      <>
                        <View.Item>
                          Data:
                          <TextArea
                            inputAttributes={{ readOnly: true }}
                            name="data"
                            value={action.data}
                          ></TextArea>
                        </View.Item>
                        <View.Item>
                          Data Actions:{" "}
                          <pre>
                            <DataActionPreview
                              data={action.data as Hex}
                              to={action.to as Address}
                            />
                          </pre>
                        </View.Item>
                      </>
                    ) : (
                      <View.Item>No data</View.Item>
                    )}
                    <View.Item>
                      <View gap={4} direction="row">
                        <Button onClick={submitCallback}>Submit</Button>
                        <Button onClick={setEdit}>Edit</Button>
                      </View>
                    </View.Item>
                  </>
                ))}
              </View>
            )}
          </>
        )}
      </SafeInformation>
    </View>
  );
};
