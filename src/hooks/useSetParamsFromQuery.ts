import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Proposal } from "../schemas/proposal";

export const useSetParamsFromQuery = () => {
    const [_, setParams] = useSearchParams();
  
    return useCallback((proposal: Proposal) => {
      if (!proposal.actions?.length) {
        return;
      }
      console.log('setting params', proposal.actions);
      setParams({
        targets: proposal.actions!.map((action) => action.to).join('|'),
        data: proposal.actions!.map((action) => action.data).join('|'),
        value: proposal.actions!.map((action) => action.value).join('|'),
      })
    }, [setParams]);
  }