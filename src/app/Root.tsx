import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { Button, View } from "reshaped";
import { NetworkSwitcher } from "../components/NetworkSwitcher";
import { BrowserProvider } from "ethers";
import { NetworkContext } from "../components/Contexts";

export const Root = () => {
  const [provider, setProvider] = useState<
    ethers.BrowserProvider | undefined
  >();
  const networkIdFromRoute = useParams().networkId;

  const [currentNetwork, setCurrentNetwork] = useState<number>(0);

  const connectMetamask = useCallback(async () => {
    const provider = new BrowserProvider((window as any).ethereum, "any");
    provider.on("accountsChanged", async (accounts) => {
      console.log({ accounts });
      const newNetwork = await provider.getNetwork();
      setCurrentNetwork(Number(newNetwork.chainId));
    });
    provider.on("disconnect", () => {
      setProvider(undefined);
      setCurrentNetwork(0);
    });
    provider.on("connect", async () => {
      setProvider(provider);
      const network = await provider.getNetwork();
      setCurrentNetwork(Number(network.chainId));
    });
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    if (provider && signer) {
      const network = await provider.getNetwork();
      setCurrentNetwork(Number(network.chainId));
      setProvider(provider);
    }
  }, [setProvider, setCurrentNetwork]);
  useEffect(() => {
    connectMetamask();
  }, [connectMetamask]);

  const networkContext: NetworkContext | undefined = useMemo(() => {
    if (!provider) return;

    return {
      walletProvider: provider,
      currentNetwork,
    };
  }, [provider, currentNetwork]);

  useEffect(() => {
    if (!networkIdFromRoute) return;
    if (currentNetwork !== Number(networkIdFromRoute)) {
      provider?.send("wallet_switchEthereumChain", [
        {
          chainId: `0x${parseInt(networkIdFromRoute).toString(16)}`,
        },
      ]);

      setCurrentNetwork(Number(networkIdFromRoute));
    }
  }, [currentNetwork, networkIdFromRoute, setCurrentNetwork, provider]);

  if (!networkContext) {
    return (
      <View padding={10} justify="space-between" gap={6} direction="column">
        <Button onClick={connectMetamask}>Connect Web3</Button>
      </View>
    );
  }

  return (
    <>
      <br />
      <br />
      <NetworkSwitcher currentNetwork={networkIdFromRoute} />
      <Outlet context={networkContext} />
    </>
  );
};
