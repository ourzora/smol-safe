import { useCallback } from "react";
import { Proposal } from "../schemas/proposal";
import { useRedirectToProposalWithNewParams } from "./useSetParamsFromQuery";

export type UpdateProposal = {
  addAction: (newAction: NonNullable<Proposal["actions"]>[0]) => void;
  replace: (proposal: Proposal) => void;
};
export const useUpdateProposal = ({
  proposal,
}: {
  proposal: Proposal | undefined;
}): UpdateProposal => {
  const setParams = useRedirectToProposalWithNewParams();

  const addAction = useCallback(
    (newAction: NonNullable<Proposal["actions"]>[0]) => {
      setParams({
        actions: [...(proposal?.actions || []), newAction],
        nonce: proposal?.nonce,
      });
    },
    [proposal, setParams]
  );

  return {
    addAction,
    replace: setParams,
  };
};
