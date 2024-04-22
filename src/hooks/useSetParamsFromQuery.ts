import { useCallback } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Proposal } from "../schemas/proposal";
import { queryKeys } from "./useLoadProposalFromQuery";

export const useRedirectToProposalWithNewParams = () => {
  const [, setParams] = useSearchParams();
  const { networkId, safeAddress } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return useCallback(
    (proposal: Proposal) => {
      if (!proposal.actions?.length) {
        return;
      }
      const params = {
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
      };
      // if we are not in a new safe proposal, we need to redirect to new safe proposal
      // so that it shows up in the url, and renders correctly
      if (!pathname.includes("new")) {
        const newPath = `/safe/${networkId}/${safeAddress}/new`;

        navigate(newPath, {
          replace: true,
        });
      }
      setParams(params);
    },
    [setParams, networkId, safeAddress, pathname, navigate]
  );
};
