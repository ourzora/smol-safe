import { useCallback, useContext, useEffect, useState } from "react";
import { Address, Hex } from "viem";
import {
  base,
  baseGoerli,
  goerli,
  mainnet,
  optimism,
  zora,
  zoraTestnet,
} from "viem/chains";
import { CurrentNetwork } from "../app/Root";

const networkToEtherActor: any = {
  [mainnet.id]: "mainnet",
  [zora.id]: "zora",
  [baseGoerli.id]: "base-goerli",
  [base.id]: "base",
  [goerli.id]: "goerli",
  [zoraTestnet.id]: "zora-goerli",
  [optimism.id]: "optimism",
};

export const DataActionPreview = ({ to, data }: { to: Address; data: Hex }) => {
  const currentNetwork = useContext(CurrentNetwork);
  const [responseData, setResponseData] = useState<any>();

  const fetchData = useCallback(async () => {
    const response = await fetch(
      `https://${networkToEtherActor[currentNetwork]}.ether.actor/decode/${to}/${data}`
    );
    const json = await response.json();
    setResponseData(json);
  }, [to, data, setResponseData]);

  useEffect(() => {
    fetchData();
  }, [to, data]);

  return <pre>{JSON.stringify(responseData, null, 2)}</pre>;
};
