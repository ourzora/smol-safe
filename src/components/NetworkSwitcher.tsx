/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useCallback, useEffect } from "react";
import { FormControl, Select } from "reshaped";
import { allowedNetworks } from "../chains";
import { BrowserProvider } from "ethers";

export const NetworkSwitcher = ({
  currentNetwork,
  setCurrentNetwork,
  provider,
}: {
  currentNetwork: number;
  setCurrentNetwork: (chainId: number) => void;
  provider: BrowserProvider | undefined;
}) => {
  const changeNetwork = useCallback(
    ({ value }: { value: string }) => {
      provider?.send("wallet_switchEthereumChain", [
        {
          chainId: `0x${parseInt(value).toString(16)}`,
        },
      ]);
    },
    [provider],
  );

  useEffect(() => {
    const handleChainChanged = (chainId: unknown) => {
      setCurrentNetwork(parseInt(chainId as string));
    };
    // @ts-ignore
    window.ethereum?.on("chainChanged", handleChainChanged);

    return () => {
      // @ts-ignore
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  });

  return (
    <FormControl>
      <FormControl.Label>Network:</FormControl.Label>
      <Select
        name="network"
        value={currentNetwork.toString()}
        onChange={changeNetwork}
        options={Object.values(allowedNetworks)
          .filter((d) => !!d)
          .map((allowedNetwork) => ({
            value: allowedNetwork.id.toString(),
            label: allowedNetwork.name,
          }))}
      ></Select>
    </FormControl>
  );
};
