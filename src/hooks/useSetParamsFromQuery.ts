import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Proposal } from "../schemas/proposal";
import { queryKeys } from "./useLoadProposalFromQuery";

export const useRedirectToProposalWithNewParams = () => {
  const [, setParams] = useSearchParams();

  return useCallback(
    (proposal: Proposal) => {
      if (!proposal.actions?.length) {
        return;
      }
      setParams({
        [queryKeys.targets]: proposal
          .actions!.map((action) => action.to)
          .join("|"),
        [queryKeys.calldatas]: proposal
          .actions!.map((action) => action.data)
          .join("|"),
        [queryKeys.values]: proposal
          .actions!.map((action) => action.value)
          .join("|"),
        ...(proposal.nonce
          ? {
              [queryKeys.nonce]: proposal.nonce.toString(),
            }
          : {}),
      });
    },
    [setParams]
  );
};
