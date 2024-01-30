import { Field, FieldArray, Formik } from "formik";
import { SafeInformation } from "../components/SafeInformation";
import { Card, View, Text, Button, useToast } from "reshaped";
import {
  SyntheticEvent,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Address, Hex, formatEther } from "viem";
import { validateAddress, validateETH } from "../utils/validators";
import { GenericField } from "../components/GenericField";
import { DataActionPreview } from "../components/DataActionPreview";
import Safe, { EthersAdapter } from "@safe-global/protocol-kit";
import { WalletProviderContext } from "./Root";
import { ethers } from "ethers";
import { contractNetworks } from "../chains";
import { SafeInformationContext } from "./ViewSafe";
import {
  DEFAULT_ACTION_ITEM,
  DEFAULT_PROPOSAL,
  Proposal,
  proposalSchema,
} from "../schemas/proposal";
import { useSetParamsFromQuery } from "../hooks/useSetParamsFromQuery";
import { useLoadProposalFromQuery } from "../hooks/useLoadProposalFromQuery";
import {
  transformValuesFromWei,
  transformValuesToWei,
} from "../utils/etherFormatting";
import { BrowserProvider } from "ethers";

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

const createSafeAdapter = async ({
  provider,
  safeAddress,
}: {
  provider: BrowserProvider;
  safeAddress: Address;
}) => {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: await provider!.getSigner(),
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

  return await safe.createTransaction({
    transactions: proposal.actions,
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
  provider: BrowserProvider | null;
  safeAddress: Address | undefined;
}) => {
  const [safe, setSafe] = useState<Safe>();

  useEffect(() => {
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

const useGetSafeTxApprovals = ({ proposal }: { proposal: Proposal }) => {
  const safeInformation = useContext(SafeInformationContext);

  const safeSdk = safeInformation?.safeSdk;
  const safeSdk2 = safeInformation?.safeSdk2;

  const [approvers, setApprovers] = useState<Address[]>([]);

  const loadApprovers = useCallback(async () => {
    if (!safeSdk || !safeSdk2) return;
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

const useAccountAddress = () => {
  const walletProvider = useContext(WalletProviderContext);

  const [address, setAddress] = useState<Address>();

  useEffect(() => {
    if (!walletProvider) return;

    (async () => {
      const signer = await walletProvider.getSigner();
      setAddress((await signer.getAddress()) as Address | undefined);
    })();
  }, [walletProvider]);

  return address;
};

function determineIfCanExecute({
  hasApproved,
  totalApprovers,
  threshold,
}: {
  hasApproved: boolean;
  totalApprovers: number;
  threshold: number;
}) {
  const remainingNeeded = threshold - totalApprovers;

  if (remainingNeeded === 0) {
    return true;
  }

  // if there is one left, and i haven't signed, i can sign and approve
  if (remainingNeeded === 1) {
    if (!hasApproved) {
      return true;
    }
  }

  return false;
}

const ViewProposal = ({
  handleEditClicked,
  proposal,
}: {
  proposal: Proposal;
  handleEditClicked: (evt: SyntheticEvent) => void;
}) => {
  const safeInformation = useContext(SafeInformationContext);
  const walletProvider = useContext(WalletProviderContext);
  const safe = useSafe({
    provider: walletProvider,
    safeAddress: safeInformation?.address,
  });

  const toaster = useToast();

  const { approvers, loadApprovers } = useGetSafeTxApprovals({ proposal });

  const address = useAccountAddress();

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

  const hasApproved = address ? approvers.includes(address as Address) : false;

  // count others that are needed to sign, taking into account self must have signed, and if self has signed
  // exclude from others needed to sign
  const canExecute = determineIfCanExecute({
    hasApproved,
    totalApprovers: approvers.length,
    threshold: safeInformation?.threshold || 0,
  });

  return (
    <>
      <View>
        <View.Item>Nonce: {proposal.nonce}</View.Item>
        {proposal.actions?.map((action, indx: number) => (
          <>
            <View.Item>Proposal #{indx}</View.Item>
            <View.Item>To: {action.to as Address}</View.Item>
            <View.Item>Value: {formatEther(BigInt(action.value))}</View.Item>
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
      </View>
      <View>
        <View.Item>
          Approvers: ({approvers.length} out of {safeInformation?.threshold}{" "}
          signed)
        </View.Item>
        {approvers.map((approver) => (
          <View.Item key={approver}>
            {approver} <b>{approver === address && "(you)"}</b>
          </View.Item>
        ))}
      </View>
      <View gap={4} direction="row">
        <Button onClick={handleEditClicked}>Edit</Button>
        <Button onClick={signCallback} disabled={hasApproved}>
          Sign
        </Button>
        <Button onClick={signAndExecuteCallback} disabled={!canExecute}>
          Sign and Execute
        </Button>
      </View>
    </>
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
  const setProposalParams = useSetParamsFromQuery();
  const onSubmit = useCallback(
    (result: Proposal) => {
      setProposal(transformValuesToWei(result));
      if (proposal) {
        setProposalParams(proposal);
      }
      setIsEditing(false);
    },
    [setIsEditing, setProposal],
  );

  const defaultActions = proposal || DEFAULT_PROPOSAL;

  return (
    <View paddingTop={4}>
      <Card>
        <Formik
          validationSchema={proposalSchema}
          initialValues={transformValuesFromWei(defaultActions)}
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
    </View>
  );
};

export const NewSafeProposal = () => {
  const [proposal, setProposal] = useState<undefined | Proposal>(
    DEFAULT_PROPOSAL,
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
    [setIsEditing],
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
