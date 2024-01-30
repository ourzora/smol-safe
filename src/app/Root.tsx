import { ethers } from "ethers";
import { createContext, useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Button, View } from "reshaped";
import { NetworkSwitcher } from "../components/NetworkSwitcher";
import { BrowserProvider } from "ethers";

export const WalletProviderContext =
  createContext<null | ethers.BrowserProvider>(null);
export const CurrentNetwork = createContext(0);

export const Root = () => {
  const [provider, setProvider] = useState<
    ethers.BrowserProvider | undefined
  >();
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

  if (!provider) {
    return (
      <View padding={10} justify="space-between" gap={6} direction="column">
        <Button onClick={connectMetamask}>Connect Web3</Button>
      </View>
    );
  }

  return (
    <WalletProviderContext.Provider value={provider}>
      <CurrentNetwork.Provider value={currentNetwork}>
        <br />
        <br />
        <NetworkSwitcher {...{ currentNetwork, setCurrentNetwork, provider }} />
        <Outlet />
      </CurrentNetwork.Provider>
    </WalletProviderContext.Provider>
  );
};
