import { useCallback, useContext } from "react";
import { Proposal } from "../schemas/proposal";
import { ProposalContext } from "../app/NewSafeProposal";
import { useSetParamsFromQuery } from "./useSetParamsFromQuery";

export const useUpdateProposalViaQuery = () => {
  const setParams = useSetParamsFromQuery();
  const proposal = useContext(ProposalContext);

  return useCallback(
    (newAction: NonNullable<Proposal["actions"]>[0]) => {
      setParams({
        actions: [...(proposal?.actions || []), newAction],
        nonce: proposal?.nonce,
      });
    },
    [proposal, setParams],
  );
};
