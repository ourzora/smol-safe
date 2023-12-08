import { Field, FieldArray, Formik } from "formik";
import { SafeInformation } from "./SafeInformation";
import { Card, View, Text, Button, useToast } from "reshaped";
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
import { DataActionPreview } from "../components/DataActionPreview";
import Safe, { EthersAdapter } from "@safe-global/protocol-kit";
import { WalletProviderContext } from "./Root";
import { ethers } from "ethers";
import { contractNetworks } from "../chains";
import { SafeInformationContext } from "./ViewSafe";

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

type ActionItem = {
  to: Address;
  value: string;
  data: Hex;
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

const createSafeAdapter = async ({
  provider,
  safeAddress,
}: {
  provider: ethers.providers.Web3Provider;
  safeAddress: Address;
}) => {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: provider!.getSigner(),
  });
  return await Safe.create({
    ethAdapter,
    safeAddress,
    contractNetworks,
  });
};

const createSafeTransaction = async ({
  proposal,
  safe,
}: {
  proposal: Proposal;
  safe: Safe;
}) => {
  if (!proposal.actions) {
    return;
  }
  const proposalData =
    proposal.actions.length === 1 ? proposal.actions[0] : proposal?.actions;

  return await safe.createTransaction({
    safeTransactionData: proposalData,
    options: { nonce: proposal.nonce || undefined },
  });
};

const signTx = async ({
  proposal,
  safe,
}: {
  proposal: Proposal;
  safe: Safe;
}) => {
  const txn = await createSafeTransaction({
    proposal,
    safe,
  });
  if (!txn) {
    throw new Error("No txn");
  }
  // const executedTxn = await safe.executeTransaction(txn);
  // const response = await executedTxn.transactionResponse?.wait();
  const txHash = await safe.getTransactionHash(txn);
  const executedTxn = await safe.approveTransactionHash(txHash);
  /*const response = */ await executedTxn.transactionResponse?.wait();

  return executedTxn;
};

const signAndExecuteTx = async ({
  proposal,
  safe,
}: {
  proposal: Proposal;
  safe: Safe;
}) => {
  const txn = await createSafeTransaction({
    proposal,
    safe,
  });
  if (!txn) {
    throw new Error("No txn");
  }
  const executedTxn = await safe.executeTransaction(txn);
  /*const response = */ await executedTxn.transactionResponse?.wait();

  return executedTxn;
};

const useSafe = ({
  provider,
  safeAddress,
}: {
  provider: ethers.providers.Web3Provider | null;
  safeAddress: Address | undefined;
}) => {
  const [safe, setSafe] = useState<Safe>();

  useEffect(() => {
    console.log({ provider, safeAddress });
    if (!provider || !safeAddress) {
      return;
    }

    const loadSafe = async () => {
      const adapter = await createSafeAdapter({ provider, safeAddress });
      setSafe(adapter);
    };

    loadSafe();
  }, [provider, safeAddress]);

  return safe;
};

const useLoadProposalFromQuery = () => {
  const [proposal, setProposal] = useState<undefined | Proposal>();
  const [params] = useSearchParams();

  useEffect(() => {
    const targets = params.get("targets")?.split("|");
    const calldatas = params.get("calldatas")?.split("|");
    const values = params.get("values")?.split("|");
    console.log(params.get("targets"));
    console.log(params.get("calldatas"));
    if (targets && calldatas) {
      // ensure the 3 lengths are the same.  check if values also has the same length if its not empty
      // check the inverse of the above, if inverse is true, return:
      if (
        targets.length !== calldatas.length ||
        (values?.length && values?.length !== targets.length)
      ) {
        console.log("invalid lengths");
        return;
      }

      const actions = targets.map((target, index) => ({
        to: target,
        data: calldatas[index]!,
        value: (values && values[index]) || "0",
      }));
      setProposal({ actions });
    }
  }, [params, setProposal]);

  return proposal;
};

const useGetSafeTxApprovals = ({ proposal }: { proposal: Proposal }) => {
  const safeInformation = useContext(SafeInformationContext);

  const safeSdk = safeInformation?.safeSdk;
  const safeSdk2 = safeInformation?.safeSdk2;

  const [approvers, setApprovers] = useState<Address[]>([]);

  const loadApprovers = useCallback(async () => {
    if (!safeSdk || !safeSdk2) return;
    // const { safeSdk, safeSdk2 } = await getSafeSDK(safeAddress);
    const txn = await createSafeTransaction({
      proposal,
      safe: safeSdk,
    });

    if (!txn) return;

    const txHash = await safeSdk.getTransactionHash(txn);
    const ownersWhoApprovedTx = await safeSdk2.getOwnersWhoApprovedTx(txHash);

    setApprovers(ownersWhoApprovedTx as Address[]);
  }, [proposal, safeSdk, safeSdk2]);

  useEffect(() => {
    loadApprovers();
  }, [loadApprovers]);

  return { approvers, loadApprovers };
};

const ViewProposal = ({
  handleEditClicked,
  proposal,
}: {
  proposal: Proposal;
  handleEditClicked: (evt: SyntheticEvent) => void;
}) => {
  const safe = useSafe({
    provider: useContext(WalletProviderContext),
    safeAddress: useContext(SafeInformationContext)?.address,
  });

  const toaster = useToast();

  const { approvers, loadApprovers } = useGetSafeTxApprovals({ proposal });

  const signCallback = useCallback(async () => {
    if (!safe) return;
    try {
      const executedTxn = await signTx({
        proposal: proposal!,
        safe,
      });
      // call submit
      toaster.show({
        title: "Approved Txn Hash",
        text: `Approved with hash: ${executedTxn.hash}`,
      });
      loadApprovers();
    } catch (e: any) {
      toaster.show({
        title: "Error creating safe",
        text: `Message: ${e.message}`,
      });
    }
  }, [proposal, safe, toaster, loadApprovers]);

  const signAndExecuteCallback = useCallback(async () => {
    if (!safe) return;
    try {
      const executedTxn = await signAndExecuteTx({
        proposal: proposal!,
        safe,
      });
      // call submit
      toaster.show({
        title: "Executed Txn Hash",
        text: `Executed with hash: ${executedTxn.hash}`,
      });

      loadApprovers();
    } catch (e: any) {
      toaster.show({
        title: "Error creating safe",
        text: `Message: ${e.message}`,
      });
    }
  }, [proposal, safe, toaster, loadApprovers]);

  return (
    <View>
      <View.Item>Nonce: {proposal.nonce}</View.Item>
      {proposal.actions?.map((action, indx: number) => (
        <>
          <View.Item>Proposal #{indx}</View.Item>
          <View.Item>To: {action.to as Address}</View.Item>
          <View.Item>Value: {action.value}</View.Item>
          {action.data ? (
            <>
              <View.Item>Data: {action.data}</View.Item>
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
        </>
      ))}
      <View.Item>Approvers: {approvers.join(",")}</View.Item>
      <View.Item>
        <View gap={4} direction="row">
          <Button onClick={handleEditClicked}>Edit</Button>
          <Button onClick={signCallback}>Sign</Button>
          <Button onClick={signAndExecuteCallback}>Sign and Execute</Button>
        </View>
      </View.Item>
    </View>
  );
};

const EditProposal = ({
  proposal,
  setProposal: setProposal,
  setIsEditing,
}: {
  proposal: Proposal | undefined;
  setProposal: (result: Proposal) => void;
  setIsEditing: (editing: boolean) => void;
}) => {
  const onSubmit = useCallback(
    (result: Proposal) => {
      setProposal(result);
      // setParams({ proposal: JSON.stringify(result) });
      setIsEditing(false);
    },
    [setIsEditing, setProposal]
  );

  const defaultActions = proposal || DEFAULT_PROPOSAL;

  return (
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
                      <Button onClick={actions.handlePush(DEFAULT_ACTION_ITEM)}>
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
  );
};

export const NewSafeProposal = () => {
  const [proposal, setProposal] = useState<undefined | Proposal>(
    DEFAULT_PROPOSAL
  );
  const [isEditing, setIsEditing] = useState(true);

  const proposalFromQuery = useLoadProposalFromQuery();

  useEffect(() => {
    if (proposalFromQuery) {
      setProposal(proposalFromQuery);
      setIsEditing(false);
    }
  }, [proposalFromQuery]);

  const handleEditClicked = useCallback(
    (evt: SyntheticEvent) => {
      setIsEditing(true);
      evt.preventDefault();
    },
    [setIsEditing]
  );

  return (
    <View paddingTop={4} paddingBottom={8} gap={8}>
      <SafeInformation>
        {isEditing && (
          <EditProposal
            proposal={proposal}
            setProposal={setProposal}
            setIsEditing={setIsEditing}
          />
        )}
        {!isEditing && proposal && (
          <ViewProposal
            proposal={proposal}
            handleEditClicked={handleEditClicked}
          />
        )}
      </SafeInformation>
    </View>
  );
};
