import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Proposal } from "../schemas/proposal";

export const useLoadProposalFromQuery = () => {
    const [proposal, setProposal] = useState<undefined | Proposal>();
    const [params] = useSearchParams();
  
    useEffect(() => {
      const targets = params.get("targets")?.split("|");
      const calldatas = params.get("calldatas")?.split("|");
      const values = params.get("values")?.split("|");
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