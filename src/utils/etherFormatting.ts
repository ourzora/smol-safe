import { formatEther, parseEther } from "viem";
import { Proposal } from "../schemas/proposal";

export function transformValuesToWei(proposal: Proposal): Proposal {
  return {
    ...proposal,
    actions: proposal.actions?.map((action) => ({
      ...action,
      value: parseEther(action.value).toString(),
    })),
  };
}

export function transformValuesFromWei(proposal: Proposal): Proposal {
  return {
    ...proposal,
    actions: proposal.actions?.map((action) => ({
      ...action,
      value: formatEther(BigInt(action.value)),
    })),
  };
}
