import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Proposal } from "../schemas/proposal";

export const queryKeys = {
  targets: "targets",
  calldatas: "calldatas",
  values: "values",
  nonce: "nonce",
} as const;

export const useLoadProposalFromQuery = () => {
  const [proposal, setProposal] = useState<undefined | Proposal>();
  const [params] = useSearchParams();

  useEffect(() => {
    const targets = params.get(queryKeys["targets"])?.split("|");
    const calldatas = params.get(queryKeys["calldatas"])?.split("|");
    const values = params.get(queryKeys["values"])?.split("|");
    const nonce = params.get(queryKeys["nonce"]);

    if (targets && calldatas) {
      // ensure the 3 lengths are the same.  check if values also have the same length if it's not empty
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

      console.log({ actions, txt: "setting proposal" });

      const proposal: Proposal = {
        actions,
        ...(nonce ? { nonce: parseInt(nonce) } : {}),
      };

      setProposal(proposal);
    }
  }, [params, setProposal]);

  return proposal;
};
