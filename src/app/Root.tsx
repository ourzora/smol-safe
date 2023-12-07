import { Web3Provider } from "@ethersproject/providers";
import { ethers } from "ethers";
import { createContext, useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Button, View } from "reshaped";

export const WalletProviderContext = createContext<null | Web3Provider>(null);
export const CurrentNetwork = createContext({ chainId: 0 });

export const Root = () => {
  const [provider, setProvider] = useState<Web3Provider | undefined>();
  const [currentNetwork, setCurrentNetwork] = useState(0);
  const connectMetamask = useCallback(async () => {
    const provider = new ethers.providers.Web3Provider(
      (window as any).ethereum
    );
    provider.on("accountsChanged", async (accounts) => {
      console.log({ accounts });
      const newNetwork = await provider.getNetwork();
      setCurrentNetwork(newNetwork.chainId);
    });
    provider.on("disconnect", () => {
      setProvider(undefined);
      setCurrentNetwork(0);
    });
    provider.on("connect", async () => {
      setProvider(provider);
      const network = await provider.getNetwork();
      setCurrentNetwork(network.chainId);
    });
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    if (provider && signer) {
      const network = await provider.getNetwork();
      setCurrentNetwork(network.chainId);
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
        <Outlet />
      </CurrentNetwork.Provider>
    </WalletProviderContext.Provider>
  );
};
